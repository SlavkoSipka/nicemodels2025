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

  const [impQ, clkQ, bannersQ] = await Promise.all([
    (async () => {
      let q = admin.from('banner_impressions').select('created_at,banner_id').limit(LIMIT_ROWS)
      if (sinceIso) q = q.gte('created_at', sinceIso)
      return q
    })(),
    (async () => {
      let q = admin.from('banner_clicks').select('created_at,banner_id,click_type').limit(LIMIT_ROWS)
      if (sinceIso) q = q.gte('created_at', sinceIso)
      return q
    })(),
    admin.from('banners').select('id,title,status,owner_id,owner_type,starts_at,expires_at'),
  ])

  const impressions = (impQ.data || []) as any[]
  const clicks = (clkQ.data || []) as any[]
  const banners = (bannersQ.data || []) as any[]

  // Status counts
  const statusCounts: Record<string, number> = {}
  for (const b of banners) statusCounts[b.status || 'unknown'] = (statusCounts[b.status || 'unknown'] || 0) + 1

  // Time series
  const dayMap: Record<string, { date: string; impressions: number; clicks: number }> = {}
  const skel = bucketByDay(impressions, since)
  for (const s of skel) dayMap[s.date] = { date: s.date, impressions: 0, clicks: 0 }
  for (const i of impressions) {
    const d = i.created_at.slice(0, 10)
    if (!dayMap[d]) dayMap[d] = { date: d, impressions: 0, clicks: 0 }
    dayMap[d].impressions++
  }
  for (const c of clicks) {
    const d = c.created_at.slice(0, 10)
    if (!dayMap[d]) dayMap[d] = { date: d, impressions: 0, clicks: 0 }
    dayMap[d].clicks++
  }
  const series = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date))

  // Top banners (by clicks)
  const impsByBanner = new Map<string, number>()
  const clicksByBanner = new Map<string, number>()
  for (const i of impressions) impsByBanner.set(i.banner_id, (impsByBanner.get(i.banner_id) || 0) + 1)
  for (const c of clicks) clicksByBanner.set(c.banner_id, (clicksByBanner.get(c.banner_id) || 0) + 1)

  const bannerMap = new Map(banners.map(b => [b.id, b]))
  const activeOrAny = banners.map(b => b.id)
  const topBanners = activeOrAny
    .map(id => {
      const imps = impsByBanner.get(id) || 0
      const clk = clicksByBanner.get(id) || 0
      const b: any = bannerMap.get(id)
      const ctr = imps ? (clk / imps) * 100 : 0
      return { id, title: b?.title || 'Banner', status: b?.status, owner_type: b?.owner_type, impressions: imps, clicks: clk, ctr }
    })
    .filter(b => b.impressions > 0 || b.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, 15)

  const totalImps = impressions.length
  const totalClicks = clicks.length
  const overallCtr = totalImps ? (totalClicks / totalImps) * 100 : 0

  return NextResponse.json({
    range,
    kpis: {
      totalImpressions: totalImps,
      totalClicks,
      overallCtr: +overallCtr.toFixed(2),
      activeBanners: statusCounts.active || 0,
      pendingBanners: statusCounts.pending || 0,
    },
    statusCounts,
    series,
    topBanners,
  })
}
