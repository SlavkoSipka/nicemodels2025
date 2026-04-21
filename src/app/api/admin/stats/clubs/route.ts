import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin, parseRange, rangeToDate, bucketByDay } from '@/lib/adminApi'

export const runtime = 'nodejs'

const LIMIT_ROWS = 30000

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const range = parseRange(url)
  const since = rangeToDate(range)
  const sinceIso = since ? since.toISOString() : null

  const admin = createAdminClient()

  let q = admin.from('club_analytics').select('created_at,event_type,club_id,viewer_id,viewer_role').limit(LIMIT_ROWS)
  if (sinceIso) q = q.gte('created_at', sinceIso)
  const { data: rows } = await q

  const list = (rows || []) as any[]

  const counts = { profile_view: 0, contact_click: 0 }
  const byClub = new Map<string, number>()
  for (const r of list) {
    if (counts[r.event_type as keyof typeof counts] !== undefined) {
      counts[r.event_type as keyof typeof counts]++
    }
    if (r.event_type === 'profile_view') {
      byClub.set(r.club_id, (byClub.get(r.club_id) || 0) + 1)
    }
  }

  const series = bucketByDay(list, since, r => r.event_type).map(d => ({
    date: d.date,
    profile_view: d.profile_view || 0,
    contact_click: d.contact_click || 0,
  }))

  const topEntries = [...byClub.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  const topIds = topEntries.map(([id]) => id)

  let topClubs: { id: string; name: string; views: number; contacts: number }[] = []
  if (topIds.length > 0) {
    const [{ data: profiles }, { data: details }] = await Promise.all([
      admin.from('profiles').select('id,username').in('id', topIds),
      admin.from('club_details').select('club_id,club_name').in('club_id', topIds),
    ])
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    const detailMap = new Map((details || []).map((d: any) => [d.club_id, d]))

    const contacts = new Map<string, number>()
    for (const r of list) {
      if (!topIds.includes(r.club_id)) continue
      if (r.event_type === 'contact_click') contacts.set(r.club_id, (contacts.get(r.club_id) || 0) + 1)
    }

    topClubs = topEntries.map(([id, views]) => ({
      id,
      name: (detailMap.get(id) as any)?.club_name || (profileMap.get(id) as any)?.username || 'Club',
      views,
      contacts: contacts.get(id) || 0,
    }))
  }

  return NextResponse.json({
    range,
    kpis: {
      totalViews: counts.profile_view,
      totalContactClicks: counts.contact_click,
    },
    series,
    topClubs,
  })
}
