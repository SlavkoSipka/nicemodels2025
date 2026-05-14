'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart2, Eye, MousePointerClick, Lightbulb,
  Building2, Megaphone, Briefcase, Home as HomeIcon, Users,
} from 'lucide-react'

interface PeriodCounts {
  all: number
  month: number
  week: number
  today: number
}

interface BannerStat {
  id: string
  title: string
  image_path: string | null
  placement: 'feed_wide' | 'feed_card' | 'sidebar_left' | string
  status: string
  expires_at: string | null
  impressions: PeriodCounts
  clicks: PeriodCounts
}

interface ListingStat {
  id: string
  title: string | null
  listing_type: 'job' | 'rent' | string
  status: string
  created_at: string
  views: PeriodCounts
  clicks: PeriodCounts
}

interface ModelStat {
  id: string
  showname: string
  city: string | null
  photo_url: string | null
  is_verified: boolean
  views: PeriodCounts
}

interface AnalyticsData {
  profile: {
    views: PeriodCounts
    contactClicks: PeriodCounts
  }
  bannerTotals: {
    impressions: PeriodCounts
    clicks: PeriodCounts
  }
  listingTotals: {
    views: PeriodCounts
    clicks: PeriodCounts
  }
  modelTotals: {
    views: PeriodCounts
  }
  banners: BannerStat[]
  listings: ListingStat[]
  models: ModelStat[]
}

function emptyPeriod(): PeriodCounts {
  return { all: 0, month: 0, week: 0, today: 0 }
}

function bucketizeByCreatedAt(
  rows: { created_at: string }[],
  now: Date,
): PeriodCounts {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const week = today - 7 * 86400000
  const month = today - 30 * 86400000
  const out = emptyPeriod()
  for (const r of rows) {
    const t = new Date(r.created_at).getTime()
    out.all++
    if (t >= month) out.month++
    if (t >= week) out.week++
    if (t >= today) out.today++
  }
  return out
}

function placementLabel(p: string, t: (k: string) => string): { label: string; color: string } {
  if (p === 'feed_card') return { label: t('placementCard'), color: 'bg-blue-100 text-blue-700' }
  if (p === 'sidebar_left') return { label: t('placementSidebar'), color: 'bg-amber-100 text-amber-700' }
  return { label: t('placementWide'), color: 'bg-purple-100 text-purple-700' }
}

function statusBadge(status: string, t: (k: string) => string): { label: string; color: string } {
  if (status === 'active') return { label: t('statusActive'), color: 'bg-emerald-100 text-emerald-700' }
  if (status === 'pending') return { label: t('statusPending'), color: 'bg-yellow-100 text-yellow-700' }
  if (status === 'expired') return { label: t('statusExpired'), color: 'bg-gray-100 text-gray-600' }
  if (status === 'rejected') return { label: t('statusRejected'), color: 'bg-red-100 text-red-700' }
  if (status === 'deleted') return { label: t('statusDeleted'), color: 'bg-gray-100 text-gray-600' }
  return { label: status, color: 'bg-gray-100 text-gray-600' }
}

function ctr(impressions: number, clicks: number): string {
  if (!impressions) return '—'
  return `${((clicks / impressions) * 100).toFixed(1)}%`
}

export default function StatisticsPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.company.statistics')
  const tc = useTranslations('dashboard.company.common')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    profile: { views: emptyPeriod(), contactClicks: emptyPeriod() },
    bannerTotals: { impressions: emptyPeriod(), clicks: emptyPeriod() },
    listingTotals: { views: emptyPeriod(), clicks: emptyPeriod() },
    modelTotals: { views: emptyPeriod() },
    banners: [],
    listings: [],
    models: [],
  })

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setLoadError(null)

      try {
        await loadAnalytics(user.id, supabase)
      } catch {
        setLoadError(t('loadFailed'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadAnalytics = async (
    clubId: string,
    supabase: ReturnType<typeof createClient>,
  ) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 86400000)
    const monthAgo = new Date(today.getTime() - 30 * 86400000)

    const [
      profileViewsRes,
      profileContactRes,
      profileViewsMonthRes,
      profileContactMonthRes,
      profileViewsWeekRes,
      profileContactWeekRes,
      profileViewsTodayRes,
      profileContactTodayRes,
      bannersRes,
      listingsRes,
      acceptedInvitesRes,
    ] = await Promise.all([
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'profile_view'),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'contact_click'),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'profile_view').gte('created_at', monthAgo.toISOString()),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'contact_click').gte('created_at', monthAgo.toISOString()),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'profile_view').gte('created_at', weekAgo.toISOString()),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'contact_click').gte('created_at', weekAgo.toISOString()),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'profile_view').gte('created_at', today.toISOString()),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'contact_click').gte('created_at', today.toISOString()),
      supabase.from('banners').select('id, title, image_path, placement, status, expires_at, created_at').eq('owner_id', clubId).order('created_at', { ascending: false }),
      supabase.from('job_listings').select('id, title, listing_type, status, created_at').eq('club_id', clubId).neq('status', 'deleted').order('created_at', { ascending: false }),
      supabase.from('club_invites').select('invited_model_id').eq('club_id', clubId).eq('status', 'accepted'),
    ])

    const banners = (bannersRes.data || []) as Array<{
      id: string; title: string; image_path: string | null; placement: string;
      status: string; expires_at: string | null; created_at: string;
    }>
    const listings = (listingsRes.data || []) as Array<{
      id: string; title: string | null; listing_type: string; status: string; created_at: string;
    }>
    const acceptedInvites = (acceptedInvitesRes.data || []) as Array<{ invited_model_id: string }>
    const bannerIds = banners.map(b => b.id)
    const listingIds = listings.map(l => l.id)
    const modelIds = acceptedInvites.map(i => i.invited_model_id)

    const [impRes, clkRes, viewsRes, lClicksRes, modelViewsRes, modelProfilesRes, modelDetailsRes, modelPhotosRes] = await Promise.all([
      bannerIds.length
        ? supabase.from('banner_impressions').select('banner_id, created_at').in('banner_id', bannerIds)
        : Promise.resolve({ data: [] as any[] }),
      bannerIds.length
        ? supabase.from('banner_clicks').select('banner_id, created_at').in('banner_id', bannerIds)
        : Promise.resolve({ data: [] as any[] }),
      listingIds.length
        ? supabase.from('listing_views').select('listing_id, created_at').in('listing_id', listingIds)
        : Promise.resolve({ data: [] as any[] }),
      listingIds.length
        ? supabase.from('listing_clicks').select('listing_id, created_at').in('listing_id', listingIds)
        : Promise.resolve({ data: [] as any[] }),
      modelIds.length
        ? supabase.from('model_statistics').select('model_id, created_at').in('model_id', modelIds).eq('action_type', 'profile_view')
        : Promise.resolve({ data: [] as any[] }),
      modelIds.length
        ? supabase.from('profiles').select('id, username, is_verified').in('id', modelIds)
        : Promise.resolve({ data: [] as any[] }),
      modelIds.length
        ? supabase.from('model_details').select('model_id, showname, city').in('model_id', modelIds)
        : Promise.resolve({ data: [] as any[] }),
      modelIds.length
        ? supabase.from('model_photos').select('model_id, file_path, uploaded_at').in('model_id', modelIds).eq('is_approved', true).order('model_id').order('display_order', { ascending: true }).order('uploaded_at', { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ])

    const impRows = (impRes.data || []) as { banner_id: string; created_at: string }[]
    const clkRows = (clkRes.data || []) as { banner_id: string; created_at: string }[]
    const viewRows = (viewsRes.data || []) as { listing_id: string; created_at: string }[]
    const lClickRows = (lClicksRes.data || []) as { listing_id: string; created_at: string }[]
    const modelViewRows = (modelViewsRes.data || []) as { model_id: string; created_at: string }[]
    const modelProfiles = (modelProfilesRes.data || []) as { id: string; username: string; is_verified: boolean }[]
    const modelDetails = (modelDetailsRes.data || []) as { model_id: string; showname: string | null; city: string | null }[]
    const modelPhotos = (modelPhotosRes.data || []) as { model_id: string; file_path: string; uploaded_at: string }[]

    const impByBanner = new Map<string, { created_at: string }[]>()
    for (const r of impRows) {
      const arr = impByBanner.get(r.banner_id) || []
      arr.push({ created_at: r.created_at })
      impByBanner.set(r.banner_id, arr)
    }
    const clkByBanner = new Map<string, { created_at: string }[]>()
    for (const r of clkRows) {
      const arr = clkByBanner.get(r.banner_id) || []
      arr.push({ created_at: r.created_at })
      clkByBanner.set(r.banner_id, arr)
    }

    const viewsByListing = new Map<string, { created_at: string }[]>()
    for (const r of viewRows) {
      const arr = viewsByListing.get(r.listing_id) || []
      arr.push({ created_at: r.created_at })
      viewsByListing.set(r.listing_id, arr)
    }
    const clicksByListing = new Map<string, { created_at: string }[]>()
    for (const r of lClickRows) {
      const arr = clicksByListing.get(r.listing_id) || []
      arr.push({ created_at: r.created_at })
      clicksByListing.set(r.listing_id, arr)
    }

    const bannerStats: BannerStat[] = banners.map(b => ({
      id: b.id,
      title: b.title,
      image_path: b.image_path,
      placement: b.placement,
      status: b.status,
      expires_at: b.expires_at,
      impressions: bucketizeByCreatedAt(impByBanner.get(b.id) || [], now),
      clicks: bucketizeByCreatedAt(clkByBanner.get(b.id) || [], now),
    }))

    const listingStats: ListingStat[] = listings.map(l => ({
      id: l.id,
      title: l.title,
      listing_type: l.listing_type,
      status: l.status,
      created_at: l.created_at,
      views: bucketizeByCreatedAt(viewsByListing.get(l.id) || [], now),
      clicks: bucketizeByCreatedAt(clicksByListing.get(l.id) || [], now),
    }))

    // Per-model bucketing
    const viewsByModel = new Map<string, { created_at: string }[]>()
    for (const r of modelViewRows) {
      const arr = viewsByModel.get(r.model_id) || []
      arr.push({ created_at: r.created_at })
      viewsByModel.set(r.model_id, arr)
    }
    const detailsByModel = new Map(modelDetails.map(d => [d.model_id, d]))
    const photoByModel = new Map<string, string>()
    for (const p of modelPhotos) {
      if (!photoByModel.has(p.model_id)) photoByModel.set(p.model_id, p.file_path)
    }

    const modelStats: ModelStat[] = modelProfiles
      .map(m => {
        const d = detailsByModel.get(m.id)
        const filePath = photoByModel.get(m.id)
        return {
          id: m.id,
          showname: d?.showname || m.username || t('modelFallback'),
          city: d?.city ?? null,
          photo_url: filePath
            ? `${SUPA_URL}/storage/v1/object/public/model-photos/${filePath}`
            : null,
          is_verified: !!m.is_verified,
          views: bucketizeByCreatedAt(viewsByModel.get(m.id) || [], now),
        }
      })
      .sort((a, b) => b.views.all - a.views.all)

    const bannerTotalsImp = bucketizeByCreatedAt(impRows, now)
    const bannerTotalsClk = bucketizeByCreatedAt(clkRows, now)
    const listingTotalsView = bucketizeByCreatedAt(viewRows, now)
    const listingTotalsClk = bucketizeByCreatedAt(lClickRows, now)
    const modelTotalsView = bucketizeByCreatedAt(modelViewRows, now)

    setAnalytics({
      profile: {
        views: {
          all: profileViewsRes.count ?? 0,
          month: profileViewsMonthRes.count ?? 0,
          week: profileViewsWeekRes.count ?? 0,
          today: profileViewsTodayRes.count ?? 0,
        },
        contactClicks: {
          all: profileContactRes.count ?? 0,
          month: profileContactMonthRes.count ?? 0,
          week: profileContactWeekRes.count ?? 0,
          today: profileContactTodayRes.count ?? 0,
        },
      },
      bannerTotals: { impressions: bannerTotalsImp, clicks: bannerTotalsClk },
      listingTotals: { views: listingTotalsView, clicks: listingTotalsClk },
      modelTotals: { views: modelTotalsView },
      banners: bannerStats,
      listings: listingStats,
      models: modelStats,
    })
  }

  const bannerUrl = (path: string | null) =>
    path ? `${SUPA_URL}/storage/v1/object/public/banners/${path}` : null

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-xs text-gray-500">{t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/company')}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            {tc('backToDashboard')}
          </button>
        </div>

        {loadError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            {loadError}
          </div>
        )}

        {/* ================================================================
            SECTION 1 — CLUB PROFILE PAGE
        ================================================================ */}
        <SectionHeader
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-100"
          accent="text-blue-700"
          title={t('section1Title')}
          subtitle={t('section1Subtitle')}
        />

        <PeriodGrid
          label={t('profileViews')}
          sublabel={t('profileViewsHint')}
          icon={<Eye className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-100"
          counts={analytics.profile.views}
          t={t}
        />

        <PeriodGrid
          label={t('contactClicks')}
          sublabel={t('contactClicksHint')}
          icon={<MousePointerClick className="w-4 h-4 text-brand" />}
          iconBg="bg-brand/10"
          counts={analytics.profile.contactClicks}
          t={t}
        />

        <Divider />

        {/* ================================================================
            SECTION 2 — MODEL SEDCARDS
        ================================================================ */}
        <SectionHeader
          icon={<Users className="w-5 h-5 text-pink-600" />}
          iconBg="bg-pink-100"
          accent="text-pink-700"
          title={t('section2Title')}
          subtitle={t('section2Subtitle')}
        />

        {analytics.models.length === 0 ? (
          <EmptyState
            title={t('noModelsTitle')}
            body={t('noModelsBody')}
          />
        ) : (
          <>
            <PeriodGrid
              label={t('totalSedcardViews')}
              sublabel={t('totalSedcardViewsHint', { count: analytics.models.length })}
              icon={<Eye className="w-4 h-4 text-pink-600" />}
              iconBg="bg-pink-100"
              counts={analytics.modelTotals.views}
              t={t}
            />

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-sm font-bold text-gray-800 mb-1">{t('perModel')}</p>
              <p className="text-xs text-gray-500 mb-4">
                {t('perModelHint')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analytics.models.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => router.push(`/models/${m.id}`)}
                    className="text-left border border-gray-100 rounded-lg bg-gray-50 hover:bg-pink-50/40 hover:border-pink-200 transition-colors p-3 flex items-center gap-3"
                  >
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.showname}
                        className="w-12 h-12 rounded-md object-cover bg-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center text-pink-700 font-bold text-sm shrink-0">
                        {m.showname.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-gray-900 truncate">{m.showname}</p>
                        {m.is_verified && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      {m.city && <p className="text-[11px] text-gray-500 truncate">{m.city}</p>}
                      <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                        <MiniStat label={t('miniAll')} value={m.views.all} />
                        <MiniStat label={t('mini30d')} value={m.views.month} />
                        <MiniStat label={t('mini7d')} value={m.views.week} />
                        <MiniStat label={t('miniToday')} value={m.views.today} accent />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <Divider />

        {/* ================================================================
            SECTION 3 — BANNERS
        ================================================================ */}
        <SectionHeader
          icon={<Megaphone className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-100"
          accent="text-purple-700"
          title={t('section3Title')}
          subtitle={t('section3Subtitle')}
        />

        {analytics.banners.length === 0 ? (
          <EmptyState
            title={t('noBannersTitle')}
            body={t('noBannersBody')}
          />
        ) : (
          <>
            <PeriodGrid
              label={t('totalImpressions')}
              sublabel={t('totalImpressionsHint')}
              icon={<Eye className="w-4 h-4 text-purple-600" />}
              iconBg="bg-purple-100"
              counts={analytics.bannerTotals.impressions}
              t={t}
            />

            <PeriodGrid
              label={t('totalBannerClicks')}
              sublabel={t('totalBannerClicksHint')}
              icon={<MousePointerClick className="w-4 h-4 text-purple-600" />}
              iconBg="bg-purple-100"
              counts={analytics.bannerTotals.clicks}
              t={t}
              highlight={
                <span className="text-purple-700">
                  {t('ctr', { value: ctr(analytics.bannerTotals.impressions.all, analytics.bannerTotals.clicks.all) })}
                </span>
              }
            />

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-sm font-bold text-gray-800 mb-1">{t('perBanner')}</p>
              <p className="text-xs text-gray-500 mb-4">
                {t('perBannerHint')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analytics.banners.map(b => {
                  const p = placementLabel(b.placement, t)
                  const s = statusBadge(b.status, t)
                  return (
                    <div
                      key={b.id}
                      className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50"
                    >
                      {b.image_path ? (
                        <img
                          src={bannerUrl(b.image_path)!}
                          alt={b.title || t('bannerFallbackTitle')}
                          className="w-full aspect-[4/1] object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-full aspect-[4/1] bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <Megaphone className="w-6 h-6 text-purple-400" />
                        </div>
                      )}
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-900 truncate">{b.title || t('bannerFallbackTitle')}</p>
                          <div className="flex gap-1 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.color}`}>
                              {p.label}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
                              {s.label}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <StatBox label={t('boxImpressions')} value={b.impressions.all} />
                          <StatBox label={t('boxClicks')} value={b.clicks.all} />
                          <StatBox label={t('boxCtr')} value={ctr(b.impressions.all, b.clicks.all)} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <Divider />

        {/* ================================================================
            SECTION 4 — JOB / RENT LISTINGS
        ================================================================ */}
        <SectionHeader
          icon={<Briefcase className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-100"
          accent="text-amber-700"
          title={t('section4Title')}
          subtitle={t('section4Subtitle')}
        />

        {analytics.listings.length === 0 ? (
          <EmptyState
            title={t('noListingsTitle')}
            body={t('noListingsBody')}
          />
        ) : (
          <>
            <PeriodGrid
              label={t('totalListingViews')}
              sublabel={t('totalListingViewsHint')}
              icon={<Eye className="w-4 h-4 text-amber-600" />}
              iconBg="bg-amber-100"
              counts={analytics.listingTotals.views}
              t={t}
            />

            <PeriodGrid
              label={t('totalContactClicks')}
              sublabel={t('totalContactClicksHint')}
              icon={<MousePointerClick className="w-4 h-4 text-amber-600" />}
              iconBg="bg-amber-100"
              counts={analytics.listingTotals.clicks}
              t={t}
            />

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-sm font-bold text-gray-800 mb-1">{t('perListing')}</p>
              <p className="text-xs text-gray-500 mb-4">
                {t('perListingHint')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analytics.listings.map(l => {
                  const isRent = l.listing_type === 'rent'
                  const typeColor = isRent
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-purple-100 text-purple-700'
                  const s = statusBadge(l.status, t)
                  return (
                    <div
                      key={l.id}
                      className="border border-gray-100 rounded-lg bg-gray-50 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            {isRent
                              ? <HomeIcon className="w-4 h-4 text-amber-600" />
                              : <Briefcase className="w-4 h-4 text-purple-600" />
                            }
                          </div>
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {l.title || (isRent ? t('rentListingFallback') : t('jobListingFallback'))}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColor}`}>
                            {isRent ? t('typeRent') : t('typeJob')}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
                            {s.label}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <StatBox label={t('boxViews')} value={l.views.all} />
                        <StatBox label={t('boxContactClicks')} value={l.clicks.all} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Tips */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('tipsHeading')}</p>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold shrink-0">→</span>
              {t('tip1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold shrink-0">→</span>
              {t('tip2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold shrink-0">→</span>
              {t('tip3')}
            </li>
          </ul>
        </div>

      </div>
    </div>
  )
}

// ===========================================================================
// Small presentational helpers
// ===========================================================================

function SectionHeader({
  icon, iconBg, accent, title, subtitle,
}: {
  icon: React.ReactNode
  iconBg: string
  accent: string
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3 pt-2">
      <div className={`w-9 h-9 rounded-md ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className={`text-lg font-bold ${accent}`}>{title}</h2>
        <p className="text-xs text-gray-500 leading-snug">{subtitle}</p>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-200" />
}

function PeriodGrid({
  label, sublabel, icon, iconBg, counts, highlight, t,
}: {
  label: string
  sublabel?: string
  icon: React.ReactNode
  iconBg: string
  counts: PeriodCounts
  highlight?: React.ReactNode
  t: (k: string) => string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-md ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <p className="text-sm font-bold text-gray-800">{label}</p>
        {highlight && (
          <span className="ml-auto text-xs font-bold">{highlight}</span>
        )}
      </div>
      {sublabel && <p className="text-xs text-gray-500 mb-4">{sublabel}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <PeriodBox label={t('labelAll')} value={counts.all} />
        <PeriodBox label={t('labelMonth')} value={counts.month} />
        <PeriodBox label={t('labelWeek')} value={counts.week} />
        <PeriodBox label={t('labelToday')} value={counts.today} accent />
      </div>
    </div>
  )
}

function PeriodBox({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${accent ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-md px-2 py-1.5 text-center">
      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-white border border-gray-100 rounded px-1 py-0.5 text-center">
      <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
      <p className={`text-xs font-bold leading-tight ${accent ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border border-dashed border-gray-200 rounded-lg p-6 text-center">
      <p className="text-sm font-bold text-gray-700 mb-1">{title}</p>
      <p className="text-xs text-gray-500 max-w-md mx-auto">{body}</p>
    </div>
  )
}
