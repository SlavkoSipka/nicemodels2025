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

  let q = admin.from('model_statistics').select('created_at,action_type,model_id,user_id').limit(LIMIT_ROWS)
  if (sinceIso) q = q.gte('created_at', sinceIso)
  const { data: rows } = await q

  const list = (rows || []) as any[]

  const counts = { profile_view: 0, contact_view: 0, favorite_add: 0, share: 0 }
  const byModel = new Map<string, number>()
  for (const r of list) {
    if (counts[r.action_type as keyof typeof counts] !== undefined) {
      counts[r.action_type as keyof typeof counts]++
    }
    if (r.action_type === 'profile_view') {
      byModel.set(r.model_id, (byModel.get(r.model_id) || 0) + 1)
    }
  }

  // Unique daily visitors across all models
  const uniquePerDay = new Map<string, Set<string>>()
  for (const r of list) {
    const d = new Date(r.created_at).toISOString().slice(0, 10)
    if (!uniquePerDay.has(d)) uniquePerDay.set(d, new Set())
    uniquePerDay.get(d)!.add(r.user_id || `anon-${r.created_at}`)
  }

  // Series with each action type
  const series = bucketByDay(list, since, r => r.action_type).map(d => ({
    date: d.date,
    profile_view: d.profile_view || 0,
    contact_view: d.contact_view || 0,
    favorite_add: d.favorite_add || 0,
    share: d.share || 0,
  }))

  // Top models
  const topEntries = [...byModel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  const topIds = topEntries.map(([id]) => id)

  let topModels: { id: string; name: string; views: number; contacts: number; favorites: number }[] = []
  if (topIds.length > 0) {
    const [{ data: profiles }, { data: details }] = await Promise.all([
      admin.from('profiles').select('id,username').in('id', topIds),
      admin.from('model_details').select('model_id,showname').in('model_id', topIds),
    ])
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    const detailMap = new Map((details || []).map((d: any) => [d.model_id, d]))

    const contacts = new Map<string, number>()
    const favorites = new Map<string, number>()
    for (const r of list) {
      if (!topIds.includes(r.model_id)) continue
      if (r.action_type === 'contact_view') contacts.set(r.model_id, (contacts.get(r.model_id) || 0) + 1)
      if (r.action_type === 'favorite_add') favorites.set(r.model_id, (favorites.get(r.model_id) || 0) + 1)
    }

    topModels = topEntries.map(([id, views]) => ({
      id,
      name: (detailMap.get(id) as any)?.showname || (profileMap.get(id) as any)?.username || 'Model',
      views,
      contacts: contacts.get(id) || 0,
      favorites: favorites.get(id) || 0,
    }))
  }

  return NextResponse.json({
    range,
    kpis: {
      totalViews: counts.profile_view,
      totalContactViews: counts.contact_view,
      totalFavorites: counts.favorite_add,
      totalShares: counts.share,
    },
    series,
    topModels,
  })
}
