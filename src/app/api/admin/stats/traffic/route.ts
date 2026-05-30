import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin, parseRange, rangeToDate, bucketByDay } from '@/lib/adminApi'
import { denseTrafficSeriesFromRpc } from '@/lib/adminUtils'

export const runtime = 'nodejs'

const FALLBACK_ROWS = 8000

type AggJson = {
  series?: unknown
  topPaths?: unknown
  topReferrers?: unknown
  roleCounts?: unknown
  kpis?: Record<string, unknown>
}

function legacyTrafficFallback(
  list: Record<string, unknown>[],
  range: ReturnType<typeof parseRange>,
  since: Date | null,
) {
  const series = bucketByDay(
    list as { created_at: string }[],
    since,
  ).map(d => ({ date: d.date, views: d.count }))

  const total = list.length
  const unique = new Set(list.map(r => String(r.session_id || r.viewer_id || ''))).size
  const loggedIn = list.filter(r => !!r.viewer_id).length

  const pathCounts = new Map<string, number>()
  for (const r of list) {
    const p = typeof r.path === 'string' && r.path.trim() ? r.path : '/'
    pathCounts.set(p, (pathCounts.get(p) || 0) + 1)
  }
  const topPaths = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }))

  const refCounts = new Map<string, number>()
  for (const r of list) {
    let ref: string = typeof r.referrer === 'string' && r.referrer.trim()
      ? r.referrer as string
      : '(direct)'
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

  const roleCounts: Record<string, number> = {
    anonymous: 0,
    user: 0,
    model: 0,
    company: 0,
    admin: 0,
  }
  for (const r of list) {
    const role = r.viewer_id ? (String(r.viewer_role || '') || 'user') : 'anonymous'
    roleCounts[role] = (roleCounts[role] || 0) + 1
  }

  return {
    range,
    kpis: {
      totalViews: total,
      uniqueVisitors: unique,
      loggedIn,
      anonymous: total - loggedIn,
      topPath: topPaths[0]?.path || null,
    },
    series,
    topPaths,
    topReferrers,
    roleCounts,
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const range = parseRange(url)
  const since = rangeToDate(range)
  const sinceIso = since ? since.toISOString() : null

  const admin = createAdminClient()

  const { data: aggRaw, error: aggErr } = await admin.rpc('get_traffic_aggregates_v1', {
    p_since: sinceIso,
  })

  let body: Record<string, unknown>
  let usedRpc = false

  if (!aggErr && aggRaw != null && typeof aggRaw === 'object') {
    const agg = aggRaw as AggJson
    const k = (agg.kpis || {}) as Record<string, unknown>
    const rpcRole = (agg.roleCounts && typeof agg.roleCounts === 'object')
      ? (agg.roleCounts as Record<string, number>)
      : {}
    const roleCounts: Record<string, number> = {
      anonymous: Number(rpcRole.anonymous ?? 0),
      user: Number(rpcRole.user ?? 0),
      model: Number(rpcRole.model ?? 0),
      company: Number(rpcRole.company ?? 0),
      admin: Number(rpcRole.admin ?? 0),
    }
    body = {
      range,
      kpis: {
        totalViews: Number(k.total ?? 0),
        uniqueVisitors: Number(k.uniqueVisitors ?? 0),
        loggedIn: Number(k.loggedIn ?? 0),
        anonymous: Number(k.anonymous ?? 0),
        topPath: (k.topPath as string | null) ?? null,
      },
      series: denseTrafficSeriesFromRpc(agg.series, since),
      topPaths: Array.isArray(agg.topPaths)
        ? (agg.topPaths as { path: string; views: number }[])
          .map(p => ({
            path: String(p?.path ?? '/'),
            views: Number((p as { views?: unknown })?.views ?? 0),
          }))
        : [],
      topReferrers: Array.isArray(agg.topReferrers)
        ? (agg.topReferrers as { source: string; visits: number }[])
          .map(p => ({
            source: String(p?.source ?? ''),
            visits: Number((p as { visits?: unknown })?.visits ?? 0),
          }))
        : [],
      roleCounts,
    }
    usedRpc = true
  } else {
    if (aggErr) {
      console.warn('[admin/traffic] RPC fallback:', aggErr.message)
    }
    let q = admin
      .from('page_views')
      .select('created_at,path,viewer_id,viewer_role,session_id,referrer')
      .order('created_at', { ascending: false })
      .limit(FALLBACK_ROWS)
    if (sinceIso) q = q.gte('created_at', sinceIso)
    const { data: rows, error: rowsErr } = await q
    if (rowsErr) console.error('[admin/traffic] fallback query error:', rowsErr)

    body = legacyTrafficFallback((rows || []) as Record<string, unknown>[], range, since)
  }

  const res = NextResponse.json(body)

  const cacheCtl = process.env.NODE_ENV === 'production' && usedRpc
    ? 'private, s-maxage=60, stale-while-revalidate=300'
    : 'private, max-age=30'
  res.headers.set('Cache-Control', cacheCtl)

  return res
}
