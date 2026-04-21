import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin, parseRange, rangeToDate, bucketByDay } from '@/lib/adminApi'

export const runtime = 'nodejs'

const LIMIT_ROWS = 20000

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const range = parseRange(url)
  const since = rangeToDate(range)
  const sinceIso = since ? since.toISOString() : null

  const admin = createAdminClient()

  let q = admin.from('page_views').select('created_at,path,viewer_id,viewer_role,session_id,referrer').limit(LIMIT_ROWS)
  if (sinceIso) q = q.gte('created_at', sinceIso)
  const { data: rows } = await q

  const list = (rows || []) as any[]

  // Time series
  const series = bucketByDay(list, since).map(d => ({ date: d.date, views: d.count }))

  // KPIs
  const total = list.length
  const unique = new Set(list.map(r => r.session_id || r.viewer_id || '')).size
  const loggedIn = list.filter(r => !!r.viewer_id).length
  const anon = total - loggedIn

  // Top paths
  const pathCounts = new Map<string, number>()
  for (const r of list) {
    const p = r.path || '/'
    pathCounts.set(p, (pathCounts.get(p) || 0) + 1)
  }
  const topPaths = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }))

  // Referrers
  const refCounts = new Map<string, number>()
  for (const r of list) {
    let ref: string = r.referrer || '(direct)'
    try {
      if (ref !== '(direct)') {
        const u = new URL(ref)
        ref = u.hostname.replace(/^www\./, '')
      }
    } catch { /* keep raw */ }
    refCounts.set(ref, (refCounts.get(ref) || 0) + 1)
  }
  const topReferrers = [...refCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, visits]) => ({ source, visits }))

  // Role breakdown
  const roleCounts: Record<string, number> = { anonymous: 0, user: 0, model: 0, company: 0, admin: 0 }
  for (const r of list) {
    const role = r.viewer_id ? (r.viewer_role || 'user') : 'anonymous'
    roleCounts[role] = (roleCounts[role] || 0) + 1
  }

  return NextResponse.json({
    range,
    kpis: {
      totalViews: total,
      uniqueVisitors: unique,
      loggedIn,
      anonymous: anon,
      topPath: topPaths[0]?.path || null,
    },
    series,
    topPaths,
    topReferrers,
    roleCounts,
  })
}
