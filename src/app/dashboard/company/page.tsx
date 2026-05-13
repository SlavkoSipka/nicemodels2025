'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  Building2, CheckCircle, XCircle, BarChart2, Eye, Users,
  Camera, Lightbulb, Mail, LifeBuoy, ChevronRight, Bell, Megaphone,
  Briefcase
} from 'lucide-react'

interface ViewBreakdown {
  total: number
  club: number
  sedcards: number
  listings: number
  banners: number
}

/**
 * Aggregate every kind of view that contributes to a club's reach:
 *   - their own club profile views
 *   - sedcard views of every model they have linked (accepted invites)
 *   - job/rent listing views
 *   - banner impressions across all banners they bought
 *
 * Each query is best-effort: if one fails (RLS / missing table), it just
 * resolves to 0 instead of breaking the whole stat box.
 */
async function loadViewBreakdown(
  supabase: ReturnType<typeof createClient>,
  clubId: string,
): Promise<ViewBreakdown> {
  const safeCount = async (q: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> => {
    try {
      const { count, error } = await q
      if (error) return 0
      return count ?? 0
    } catch {
      return 0
    }
  }

  const [modelLinksRes, listingsRes, bannersRes, clubViewsCount] = await Promise.all([
    supabase.from('club_invites').select('invited_model_id').eq('club_id', clubId).eq('status', 'accepted'),
    supabase.from('job_listings').select('id').eq('club_id', clubId),
    supabase.from('banners').select('id').eq('owner_id', clubId),
    safeCount(
      supabase
        .from('club_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('event_type', 'profile_view'),
    ),
  ])

  const modelIds = (modelLinksRes.data ?? []).map((r: any) => r.invited_model_id).filter(Boolean) as string[]
  const listingIds = (listingsRes.data ?? []).map((r: any) => r.id).filter(Boolean) as string[]
  const bannerIds = (bannersRes.data ?? []).map((r: any) => r.id).filter(Boolean) as string[]

  const [sedcardCount, listingCount, bannerCount] = await Promise.all([
    modelIds.length === 0
      ? Promise.resolve(0)
      : safeCount(
          supabase
            .from('model_statistics')
            .select('*', { count: 'exact', head: true })
            .in('model_id', modelIds)
            .eq('action_type', 'profile_view'),
        ),
    listingIds.length === 0
      ? Promise.resolve(0)
      : safeCount(
          supabase
            .from('listing_views')
            .select('*', { count: 'exact', head: true })
            .in('listing_id', listingIds),
        ),
    bannerIds.length === 0
      ? Promise.resolve(0)
      : safeCount(
          supabase
            .from('banner_impressions')
            .select('*', { count: 'exact', head: true })
            .in('banner_id', bannerIds),
        ),
  ])

  return {
    club: clubViewsCount,
    sedcards: sedcardCount,
    listings: listingCount,
    banners: bannerCount,
    total: clubViewsCount + sedcardCount + listingCount + bannerCount,
  }
}

export default function CompanyDashboardPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.company.home')
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [clubDetails, setClubDetails] = useState<any>(null)
  const [modelCount, setModelCount] = useState<number>(0)
  const [photoCount, setPhotoCount] = useState<number>(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [views, setViews] = useState<ViewBreakdown>({ total: 0, club: 0, sedcards: 0, listings: 0, banners: 0 })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!profile?.onboarding_completed) {
      router.push('/onboarding')
      return
    }

    let cancelled = false
    const uid = user.id

    const load = async () => {
      try {
        const supabase = createClient()

        const [clubDetailsRes, modelsRes, photosRes, notifRes] = await Promise.all([
          supabase.from('club_details').select('*').eq('club_id', uid).maybeSingle(),
          supabase
            .from('club_invites')
            .select('id', { count: 'exact', head: true })
            .eq('club_id', uid)
            .eq('status', 'accepted'),
          supabase
            .from('club_photos')
            .select('id', { count: 'exact', head: true })
            .eq('club_id', uid),
          supabase
            .from('notifications')
            .select(
              'id, type, title, message, is_read, related_entity_type, related_entity_id, action_url, created_at, read_at',
            )
            .eq('user_id', uid)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        if (cancelled) return

        setClubDetails(clubDetailsRes.data ?? null)
        setModelCount(modelsRes.count ?? 0)
        setPhotoCount(photosRes.count ?? 0)
        setNotifications(notifRes.data || [])
        setLoading(false)

        loadViewBreakdown(supabase, uid).then(setViews).catch(() => {})
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, profile?.onboarding_completed, router])

  if (loading) return null

  const clubName = clubDetails?.display_name || clubDetails?.club_name || t('thereFallback')
  const clientCode = user?.id?.slice(0, 8).toUpperCase() || 'N/A'

  const hasPhotos = photoCount >= 1
  const hasModels = modelCount >= 1
  const strength = hasPhotos && hasModels ? 100 : hasPhotos || hasModels ? 65 : 35

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">

        {/* Blocked account */}
        {profile?.is_blocked && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 md:p-5">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-800 mb-1">{t('blockedTitle')}</p>
                <p className="text-sm text-red-700">
                  {t('blockedDesc')}
                  {profile?.blocked_reason && <span className="block mt-1 font-medium">{profile.blocked_reason}</span>}
                </p>
                {profile?.blocked_at && (
                  <p className="text-xs text-red-500 mt-1">
                    {t('blockedDateAt', { date: new Date(profile.blocked_at).toLocaleDateString(), time: new Date(profile.blocked_at).toLocaleTimeString() })}
                  </p>
                )}
                <div className="mt-3 text-xs text-red-700 space-y-0.5">
                  <p>{t('blockedItem1')}</p>
                  <p>{t('blockedItem2')}</p>
                  <p>{t('blockedItem3')}</p>
                  <p>{t('blockedItem4')}</p>
                </div>
                <a
                  href="mailto:info@nicemodels.ch?subject=Account Blocked - Appeal Request"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2"
                >
                  <Mail className="w-3.5 h-3.5" /> {t('contactSupportAppeal')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* How to get started */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-brand" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('howToStart')}</p>
          </div>
          <div className="space-y-3">
            {[
              {
                step: '1',
                title: t('step1Title'),
                desc: t('step1Desc'),
                action: t('step1Action'),
                href: '/dashboard/company/profile/basic-info',
              },
              {
                step: '2',
                title: t('step2Title'),
                desc: t('step2Desc'),
                action: t('step2Action'),
                href: '/dashboard/company/profile/club-photos',
              },
              {
                step: '3',
                title: t('step3Title'),
                desc: t('step3Desc'),
                action: t('step3Action'),
                href: '/dashboard/company/models',
              },
              {
                step: '4',
                title: t('step4Title'),
                desc: t('step4Desc'),
                action: t('step4Action'),
                href: '/dashboard/company/activate-ad',
              },
            ].map(({ step, title, desc, action, href }) => (
              <div key={step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
                  <p className="text-xs text-gray-500 mb-1.5">{desc}</p>
                  <button
                    onClick={() => router.push(href)}
                    className="text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors"
                  >
                    {action} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unread notifications banner */}
        {notifications.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 flex items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-brand" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  {t('unreadCount', { count: notifications.length })}
                </p>
                <p className="text-xs text-gray-500">{notifications[0]?.title}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/company/notifications')}
              className="shrink-0 text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors"
            >
              {t('viewAll')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Welcome header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">
              {t('welcomeBack')} <span className="text-brand">{clubName}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{t('agencyId', { code: clientCode })}</p>
          </div>
        </div>

        {!profile?.is_blocked && (
          <button
            type="button"
            onClick={() => router.push('/dashboard/company/buy-banner')}
            className="w-full text-left rounded-xl border border-violet-300/60 bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 md:p-5 shadow-md shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700 transition-all group"
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/20 px-2 py-0.5 rounded-full">{t('promoLabel')}</span>
                  <span className="text-sm md:text-base font-bold text-white">{t('buyHomepageBanner')}</span>
                </div>
                <p className="text-xs md:text-sm text-white/90 leading-snug">
                  {t.rich('buyHomepagePromo', { bold: (chunks) => <span className="font-semibold">{chunks}</span> })}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/90 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-5">

          {/* Left / main */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">

            {/* Photo alert */}
            {!hasPhotos && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 flex items-center justify-between gap-3 md:gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-rose-100 flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{t('needsPhotos')}</p>
                    <p className="text-xs text-gray-500">{t('needsPhotosHint')}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/dashboard/company/profile/club-photos')}
                  className="shrink-0 text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors"
                >
                  {t('upload')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Welcome notice */}
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-bold text-gray-900">{t('welcomeTitle')}</p>
              </div>
              <p className="text-sm text-gray-600 mb-3 md:mb-4">
                {t.rich('welcomeBody', { bold: (chunks) => <span className="font-semibold text-gray-900">{chunks}</span> })}
              </p>
              <div className="space-y-1.5 mb-3 md:mb-4">
                {[
                  t('welcomeTip1'),
                  t('welcomeTip2'),
                  t('welcomeTip3'),
                ].map(tip => (
                  <div key={tip} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 hidden md:block">{t('welcomeFooterHint')}</p>
                <button
                  onClick={() => router.push('/dashboard/company/profile/basic-info')}
                  className="shrink-0 text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 ml-4"
                >
                  {t('completeProfile')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* How to get started */}
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-brand" />
                </div>
                <p className="text-sm font-bold text-gray-800">{t('howToStart')}</p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: t('step1Title'),
                    desc: t('step1Desc'),
                    action: t('step1Action'),
                    href: '/dashboard/company/profile/basic-info',
                  },
                  {
                    step: '2',
                    title: t('step2Title'),
                    desc: t('step2Desc'),
                    action: t('step2Action'),
                    href: '/dashboard/company/profile/club-photos',
                  },
                  {
                    step: '3',
                    title: t('step3Title'),
                    desc: t('step3Desc'),
                    action: t('step3Action'),
                    href: '/dashboard/company/models',
                  },
                  {
                    step: '4',
                    title: t('step4Title'),
                    desc: t('step4Desc'),
                    action: t('step4Action'),
                    href: '/dashboard/company/activate-ad',
                  },
                ].map(({ step, title, desc, action, href }) => (
                  <div key={step} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
                      <p className="text-xs text-gray-500 mb-1.5">{desc}</p>
                      <button
                        onClick={() => router.push(href)}
                        className="text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors"
                      >
                        {action} <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agency tips */}
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-sm font-bold text-gray-800">{t('agencyTipsHeading')}</p>
              </div>
              <div className="space-y-2.5">
                {[
                  t('agencyTip1'),
                  t('agencyTip2'),
                  t('agencyTip3'),
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-brand font-bold shrink-0 mt-0.5">→</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right sidebar */}
          <div className="space-y-3 md:space-y-4">

            {/* Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
              <div className="flex items-center justify-between gap-2 mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">{t('clubStats')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/company/statistics')}
                  className="text-[11px] font-bold text-brand hover:text-brand-hover flex items-center gap-0.5"
                >
                  {t('details')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Hero: total views across club + sedcards + listings + banners */}
              <button
                type="button"
                onClick={() => router.push('/dashboard/company/statistics')}
                className="w-full text-left rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-3 mb-3 hover:from-blue-100/70 hover:to-indigo-100/70 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-gray-600">{t('totalViews')}</span>
                  <span className="ml-auto text-[10px] text-gray-400">{t('allTime')}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{views.total}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[11px] text-gray-600">
                  <BreakdownRow icon={Building2} label={t('clubProfileLabel')} value={views.club} color="text-blue-500" />
                  <BreakdownRow icon={Users} label={t('sedcardsLabel')} value={views.sedcards} color="text-pink-500" />
                  <BreakdownRow icon={Briefcase} label={t('jobsRentLabel')} value={views.listings} color="text-amber-500" />
                  <BreakdownRow icon={Megaphone} label={t('bannersLabel')} value={views.banners} color="text-purple-500" />
                </div>
              </button>

              <div className="space-y-3">
                {[
                  { icon: Users, label: t('activeModels'), value: modelCount, color: 'text-indigo-500' },
                  { icon: Building2, label: t('clubPhotos'), value: photoCount, color: 'text-brand' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm text-gray-600">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile strength */}
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-800">{t('profileStrength')}</p>
                <span className="text-sm font-bold text-brand">{strength}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 md:mb-4">
                <div className="bg-brand h-1.5 rounded-full transition-all duration-500" style={{ width: `${strength}%` }} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle className="w-4 h-4 shrink-0" /> {t('basicInfoAdded')}
                </div>
                <div className={`flex items-center gap-2 text-sm ${hasPhotos ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {hasPhotos
                    ? <CheckCircle className="w-4 h-4 shrink-0" />
                    : <XCircle className="w-4 h-4 shrink-0" />
                  } {t('addClubPhotos')}
                </div>
                <div className={`flex items-center gap-2 text-sm ${hasModels ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {hasModels
                    ? <CheckCircle className="w-4 h-4 shrink-0" />
                    : <XCircle className="w-4 h-4 shrink-0" />
                  } {t('addAtLeastOneModel')}
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-gray-800">{t('support')}</p>
              </div>
              <div className="space-y-2">
                <a href="mailto:info@nicemodels.ch" className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand transition-colors">
                  <Mail className="w-4 h-4 text-gray-400" /> info@nicemodels.ch
                </a>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" /> {t('liveChat')}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function BreakdownRow({
  icon: Icon, label, value, color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className={`w-3 h-3 shrink-0 ${color}`} />
      <span className="truncate text-gray-500">{label}</span>
      <span className="ml-auto font-bold text-gray-900 tabular-nums">{value}</span>
    </div>
  )
}
