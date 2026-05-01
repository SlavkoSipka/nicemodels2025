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

  const [viewsQ, clicksQ] = await Promise.all([
    (async () => {
      let q = admin.from('listing_views').select('created_at,listing_id').limit(LIMIT_ROWS)
      if (sinceIso) q = q.gte('created_at', sinceIso)
      return q
    })(),
    (async () => {
      let q = admin.from('listing_clicks').select('created_at,listing_id,click_type').limit(LIMIT_ROWS)
      if (sinceIso) q = q.gte('created_at', sinceIso)
      return q
    })(),
  ])

  if (viewsQ.error) console.error('[admin/stats/listings] listing_views error:', viewsQ.error)
  if (clicksQ.error) console.error('[admin/stats/listings] listing_clicks error:', clicksQ.error)

  const views = (viewsQ.data || []) as any[]
  const clicks = (clicksQ.data || []) as any[]

  // Counts
  const clicksByType: Record<string, number> = {}
  for (const c of clicks) clicksByType[c.click_type] = (clicksByType[c.click_type] || 0) + 1

  // Combined series (views + total clicks per day)
  const dayMap: Record<string, { date: string; views: number; clicks: number }> = {}
  for (const v of views) {
    const d = v.created_at.slice(0, 10)
    if (!dayMap[d]) dayMap[d] = { date: d, views: 0, clicks: 0 }
    dayMap[d].views++
  }
  for (const c of clicks) {
    const d = c.created_at.slice(0, 10)
    if (!dayMap[d]) dayMap[d] = { date: d, views: 0, clicks: 0 }
    dayMap[d].clicks++
  }
  // fill missing days from bucketByDay shape
  const skeleton = bucketByDay(views, since)
  const series = skeleton.map(s => dayMap[s.date] || { date: s.date, views: 0, clicks: 0 })

  // Top listings
  const viewsByListing = new Map<string, number>()
  for (const v of views) viewsByListing.set(v.listing_id, (viewsByListing.get(v.listing_id) || 0) + 1)
  const clicksByListing = new Map<string, number>()
  for (const c of clicks) clicksByListing.set(c.listing_id, (clicksByListing.get(c.listing_id) || 0) + 1)

  const topIds = [...viewsByListing.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([id]) => id)

  let topListings: { id: string; title: string; type: string; status: string; views: number; clicks: number }[] = []
  if (topIds.length > 0) {
    const { data: meta } = await admin.from('job_listings').select('id,title,listing_type,status').in('id', topIds)
    const map = new Map((meta || []).map((m: any) => [m.id, m]))
    topListings = topIds.map(id => {
      const m: any = map.get(id)
      return {
        id,
        title: m?.title || (m?.listing_type === 'rent' ? 'Rent listing' : 'Job listing'),
        type: m?.listing_type || 'job',
        status: m?.status || 'active',
        views: viewsByListing.get(id) || 0,
        clicks: clicksByListing.get(id) || 0,
      }
    })
  }

  // Listing status totals.
  // We treat "expired" as expires_at in the past (excluding deleted), regardless of the
  // status column — there is no cron that flips status to 'expired'.
  // "Active" = status='active' AND not yet past expires_at.
  const nowIso = new Date().toISOString()
  const [{ count: activeJobsC }, { count: activeRentsC }, { count: expiredC }] = await Promise.all([
    admin
      .from('job_listings')
      .select('id', { count: 'exact', head: true })
      .eq('listing_type', 'job')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`),
    admin
      .from('job_listings')
      .select('id', { count: 'exact', head: true })
      .eq('listing_type', 'rent')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`),
    admin
      .from('job_listings')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'deleted')
      .not('expires_at', 'is', null)
      .lt('expires_at', nowIso),
  ])

  return NextResponse.json({
    range,
    kpis: {
      totalViews: views.length,
      totalClicks: clicks.length,
      activeJobs: activeJobsC ?? 0,
      activeRents: activeRentsC ?? 0,
      expired: expiredC ?? 0,
    },
    clicksByType,
    series,
    topListings,
  })
}
