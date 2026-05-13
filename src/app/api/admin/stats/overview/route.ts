import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin, bucketByDay } from '@/lib/adminApi'

export const runtime = 'nodejs'

const DAY = 24 * 60 * 60 * 1000

export async function GET(_req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const since = new Date(Date.now() - 30 * DAY)
  const sinceIso = since.toISOString()

  const [
    modelsC, clubsC, visitorsC, listingsC, activeBannersC, pendingMediaP, pendingMediaV,
    verificationsC, reportsC, commentsC, ordersSum, revenue30, pageViewsSince, signupsSince,
    roleDistribution, siteActions, topModelsStats,
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'model'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'company'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
    admin.from('job_listings').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
    admin.from('banners').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('model_photos').select('id', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false'),
    admin.from('model_videos').select('id', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false'),
    admin.from('verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('model_comments').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('orders').select('total_amount').eq('status', 'paid'),
    admin.from('orders').select('total_amount').eq('status', 'paid').gte('created_at', sinceIso),
    admin.from('page_views').select('created_at').gte('created_at', sinceIso),
    admin.from('profiles').select('created_at,role').gte('created_at', sinceIso),
    admin.rpc('get_role_distribution_v1'),
    admin.from('site_actions').select('id, action_type, title, description, created_at').order('created_at', { ascending: false }).limit(15),
    admin.from('model_statistics').select('model_id').eq('action_type', 'profile_view'),
  ])

  let roleCounts: Record<string, number> = { model: 0, company: 0, user: 0, admin: 0 }
  const rpcRoles = roleDistribution.data as { role: string | null; count: number | string | null }[] | null
  const rpcRolesErr = roleDistribution.error != null || !rpcRoles
  if (rpcRolesErr) {
    const { data: allRolesRows } = await admin.from('profiles').select('role')
    const roleBuckets: Record<string, number> = { model: 0, company: 0, user: 0, admin: 0 }
    for (const r of allRolesRows ?? []) {
      const rr = ((r as { role?: string | null }).role) || ''
      if (roleBuckets[rr] !== undefined) roleBuckets[rr] += 1
    }
    roleCounts = roleBuckets
  } else {
    for (const row of rpcRoles) {
      if (!row?.role) continue
      if (roleCounts[row.role] !== undefined) {
        roleCounts[row.role] = Number(row.count ?? 0)
      }
    }
  }

  // top models by profile_view count
  const modelViewCounts = new Map<string, number>()
  for (const row of topModelsStats.data || []) {
    const id = (row as any).model_id as string
    modelViewCounts.set(id, (modelViewCounts.get(id) || 0) + 1)
  }
  const sortedTop = [...modelViewCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  const topIds = sortedTop.map(([id]) => id)

  let topModels: { id: string; name: string; views: number }[] = []
  if (topIds.length > 0) {
    const [{ data: topProfiles }, { data: topDetails }] = await Promise.all([
      admin.from('profiles').select('id,username').in('id', topIds),
      admin.from('model_details').select('model_id,showname').in('model_id', topIds),
    ])
    const profileMap = new Map((topProfiles || []).map(p => [p.id, p]))
    const detailMap = new Map((topDetails || []).map(d => [(d as any).model_id, d]))
    topModels = sortedTop.map(([id, views]) => ({
      id,
      name:
        (detailMap.get(id) as any)?.showname ||
        (profileMap.get(id) as any)?.username ||
        'Model',
      views,
    }))
  }

  // Signups per day, split by role
  const signupRows = (signupsSince.data || []) as { created_at: string; role: string }[]
  const signupSeries = bucketByDay(signupRows, since, r => r.role).map(d => ({
    date: d.date,
    models: d.model || 0,
    clubs: d.company || 0,
    users: d.user || 0,
  }))

  // Page views per day
  const pageViewRows = (pageViewsSince.data || []) as { created_at: string }[]
  const trafficSeries = bucketByDay(pageViewRows, since).map(d => ({
    date: d.date,
    views: d.count,
  }))

  // Revenue totals
  const revTotal = (ordersSum.data || []).reduce((s, r: any) => s + Number(r.total_amount || 0), 0)
  const rev30 = (revenue30.data || []).reduce((s, r: any) => s + Number(r.total_amount || 0), 0)

  const pendingMedia = (pendingMediaP.count ?? 0) + (pendingMediaV.count ?? 0)

  const res = NextResponse.json({
    kpis: {
      totalModels: modelsC.count ?? 0,
      totalClubs: clubsC.count ?? 0,
      totalVisitors: visitorsC.count ?? 0,
      totalUsers: (modelsC.count ?? 0) + (clubsC.count ?? 0) + (visitorsC.count ?? 0),
      activeListings: listingsC.count ?? 0,
      activeBanners: activeBannersC.count ?? 0,
      pendingVerifications: verificationsC.count ?? 0,
      pendingReports: reportsC.count ?? 0,
      pendingMedia,
      pendingComments: commentsC.count ?? 0,
      revenueAllTime: revTotal,
      revenue30d: rev30,
      pageViews30d: pageViewRows.length,
      signups30d: signupRows.length,
    },
    trafficSeries,
    signupSeries,
    roleCounts,
    topModels,
    siteActions: siteActions.data || [],
  })

  res.headers.set('Cache-Control', 'private, max-age=30')

  return res
}
