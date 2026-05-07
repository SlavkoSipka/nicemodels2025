'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [clubDetails, setClubDetails] = useState<any>(null)
  const [modelCount, setModelCount] = useState<number>(0)
  const [photoCount, setPhotoCount] = useState<number>(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [views, setViews] = useState<ViewBreakdown>({ total: 0, club: 0, sedcards: 0, listings: 0, banners: 0 })

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', user.id).single()

        if (!profileData?.onboarding_completed) { router.push('/onboarding'); return }

        const { data: clubData } = await supabase
          .from('club_details').select('*').eq('club_id', user.id).single()

        const { count: models } = await supabase
          .from('club_invites')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', user.id)
          .eq('status', 'accepted')

        const { count: photos } = await supabase
          .from('club_photos')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', user.id)

        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5)

        setUser(user)
        setProfile(profileData)
        setClubDetails(clubData)
        setModelCount(models ?? 0)
        setPhotoCount(photos ?? 0)
        setNotifications(notifData || [])
        setLoading(false)

        // View aggregation runs after the page is rendered so the dashboard
        // appears instantly even if the analytics queries are slow.
        loadViewBreakdown(supabase, user.id).then(setViews).catch(() => {})
      } catch {
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  if (loading) return null

  const clubName = clubDetails?.display_name || clubDetails?.club_name || 'there'
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
                <p className="text-sm font-bold text-red-800 mb-1">Account suspended</p>
                <p className="text-sm text-red-700">
                  Your account has been suspended by our administration team.
                  {profile?.blocked_reason && <span className="block mt-1 font-medium">{profile.blocked_reason}</span>}
                </p>
                {profile?.blocked_at && (
                  <p className="text-xs text-red-500 mt-1">
                    {new Date(profile.blocked_at).toLocaleDateString()} at {new Date(profile.blocked_at).toLocaleTimeString()}
                  </p>
                )}
                <div className="mt-3 text-xs text-red-700 space-y-0.5">
                  <p>· Your club profile is hidden from search results</p>
                  <p>· Clients cannot view your profile</p>
                  <p>· You cannot receive new messages</p>
                  <p>· Advertising features are disabled</p>
                </div>
                <a
                  href="mailto:info@nicemodels.ch?subject=Account Blocked - Appeal Request"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2"
                >
                  <Mail className="w-3.5 h-3.5" /> Contact support to appeal
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
            <p className="text-sm font-bold text-gray-800">How to get started</p>
          </div>
          <div className="space-y-3">
            {[
              {
                step: '1',
                title: 'Complete your club profile',
                desc: 'Go to Club Profile and fill in your basic info, contact details and working hours. This is exactly what clients will see.',
                action: 'Open Club Profile',
                href: '/dashboard/company/profile/basic-info',
              },
              {
                step: '2',
                title: 'Upload club photos',
                desc: 'Add high-quality photos of your venue. A well-presented club profile attracts far more interest.',
                action: 'Upload photos',
                href: '/dashboard/company/profile/club-photos',
              },
              {
                step: '3',
                title: 'Add models to your roster',
                desc: 'Invite or create model profiles and link them to your club. More models means more visibility in search results.',
                action: 'Manage models',
                href: '/dashboard/company/models',
              },
              {
                step: '4',
                title: 'Activate your ad',
                desc: 'Go to Activate Club Ad and choose a duration (CHF 19/29/39 for 5/14/30 days). Once paid, your club appears in search results.',
                action: 'Activate Club Ad',
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
                  {notifications.length} unread notification{notifications.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">{notifications[0]?.title}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/company/notifications')}
              className="shrink-0 text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Welcome header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">
              Welcome back, <span className="text-brand">{clubName}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">Agency ID: {clientCode}</p>
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/20 px-2 py-0.5 rounded-full">Promotion</span>
                  <span className="text-sm md:text-base font-bold text-white">Buy a homepage banner</span>
                </div>
                <p className="text-xs md:text-sm text-white/90 leading-snug">
                  Promote your club with a banner on the homepage — use <span className="font-semibold">Buy Banner</span> in the sidebar to pick a slot.
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
                    <p className="text-sm font-semibold text-gray-900">Your club profile needs photos</p>
                    <p className="text-xs text-gray-500">Upload at least 1 photo to improve your profile visibility</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/dashboard/company/profile/club-photos')}
                  className="shrink-0 text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors"
                >
                  Upload <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Welcome notice */}
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-bold text-gray-900">Welcome to nicemodels.ch</p>
              </div>
              <p className="text-sm text-gray-600 mb-3 md:mb-4">
                Get the most out of <span className="font-semibold text-gray-900">nicemodels.ch</span>. Complete your club profile, add models, then activate your club ad so visitors can find you.
              </p>
              <div className="space-y-1.5 mb-3 md:mb-4">
                {[
                  'Club ad activation from CHF 19',
                  'Banners and listings paid via Card or TWINT',
                  'A complete profile gets the most visibility',
                ].map(tip => (
                  <div key={tip} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 hidden md:block">Complete your club profile and add models to maximize visibility.</p>
                <button
                  onClick={() => router.push('/dashboard/company/profile/basic-info')}
                  className="shrink-0 text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 ml-4"
                >
                  Complete profile <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* How to get started */}
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-brand" />
                </div>
                <p className="text-sm font-bold text-gray-800">How to get started</p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: 'Complete your club profile',
                    desc: 'Go to Basic Info and fill in your identity, contact, location and amenities. This is exactly what clients will see.',
                    action: 'Open Club Profile',
                    href: '/dashboard/company/profile/basic-info',
                  },
                  {
                    step: '2',
                    title: 'Upload club photos',
                    desc: 'Add high-quality photos of your venue. A well-presented club profile attracts far more interest.',
                    action: 'Upload photos',
                    href: '/dashboard/company/profile/club-photos',
                  },
                  {
                    step: '3',
                    title: 'Add models to your roster',
                    desc: 'Invite or create model profiles and link them to your club. More models means more visibility in search results.',
                    action: 'Manage models',
                    href: '/dashboard/company/models',
                  },
                  {
                    step: '4',
                    title: 'Activate your ad',
                    desc: 'Go to Activate Club Ad and choose a duration (CHF 19/29/39 for 5/14/30 days). Once paid, your club appears in search results.',
                    action: 'Activate Club Ad',
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
                <p className="text-sm font-bold text-gray-800">Agency tips</p>
              </div>
              <div className="space-y-2.5">
                {[
                  'A complete club profile gets 3× more views than an incomplete one',
                  'Keep your model roster updated regularly for better ranking',
                  'Add high-quality photos of your venue to stand out',
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
                  <p className="text-sm font-bold text-gray-800">Club stats</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/company/statistics')}
                  className="text-[11px] font-bold text-brand hover:text-brand-hover flex items-center gap-0.5"
                >
                  Details <ChevronRight className="w-3.5 h-3.5" />
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
                  <span className="text-xs font-semibold text-gray-600">Total views</span>
                  <span className="ml-auto text-[10px] text-gray-400">all-time</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{views.total}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[11px] text-gray-600">
                  <BreakdownRow icon={Building2} label="Club profile" value={views.club} color="text-blue-500" />
                  <BreakdownRow icon={Users} label="Sedcards" value={views.sedcards} color="text-pink-500" />
                  <BreakdownRow icon={Briefcase} label="Jobs / Rent" value={views.listings} color="text-amber-500" />
                  <BreakdownRow icon={Megaphone} label="Banners" value={views.banners} color="text-purple-500" />
                </div>
              </button>

              <div className="space-y-3">
                {[
                  { icon: Users, label: 'Active models', value: modelCount, color: 'text-indigo-500' },
                  { icon: Building2, label: 'Club photos', value: photoCount, color: 'text-brand' },
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
                <p className="text-sm font-bold text-gray-800">Profile strength</p>
                <span className="text-sm font-bold text-brand">{strength}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 md:mb-4">
                <div className="bg-brand h-1.5 rounded-full transition-all duration-500" style={{ width: `${strength}%` }} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Basic info added
                </div>
                <div className={`flex items-center gap-2 text-sm ${hasPhotos ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {hasPhotos
                    ? <CheckCircle className="w-4 h-4 shrink-0" />
                    : <XCircle className="w-4 h-4 shrink-0" />
                  } Add club photos
                </div>
                <div className={`flex items-center gap-2 text-sm ${hasModels ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {hasModels
                    ? <CheckCircle className="w-4 h-4 shrink-0" />
                    : <XCircle className="w-4 h-4 shrink-0" />
                  } Add at least 1 model
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-gray-800">Support</p>
              </div>
              <div className="space-y-2">
                <a href="mailto:info@nicemodels.ch" className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand transition-colors">
                  <Mail className="w-4 h-4 text-gray-400" /> info@nicemodels.ch
                </a>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" /> Live chat available 24/7
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
