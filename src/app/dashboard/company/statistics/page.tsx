'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarChart2, Eye, Calendar, TrendingUp, MousePointerClick, Lightbulb } from 'lucide-react'

interface AnalyticsData {
  totalViews: number
  totalContactClicks: number
  viewsToday: number
  contactClicksToday: number
  viewsThisWeek: number
  contactClicksThisWeek: number
  viewsThisMonth: number
  contactClicksThisMonth: number
}

export default function StatisticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0,
    totalContactClicks: 0,
    viewsToday: 0,
    contactClicksToday: 0,
    viewsThisWeek: 0,
    contactClicksThisWeek: 0,
    viewsThisMonth: 0,
    contactClicksThisMonth: 0
  })
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoadError(null)

      try {
        await loadAnalytics(user.id, supabase)
      } catch (e) {
        setLoadError('Failed to load statistics.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadAnalytics = async (clubId: string, supabase: ReturnType<typeof createClient>) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalViewsRes,
      totalContactRes,
      viewsTodayRes,
      contactTodayRes,
      viewsWeekRes,
      contactWeekRes,
      viewsMonthRes,
      contactMonthRes
    ] = await Promise.all([
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'profile_view'),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'contact_click'),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'profile_view').gte('created_at', today.toISOString()),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'contact_click').gte('created_at', today.toISOString()),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'profile_view').gte('created_at', weekAgo.toISOString()),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'contact_click').gte('created_at', weekAgo.toISOString()),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'profile_view').gte('created_at', monthAgo.toISOString()),
      supabase.from('club_analytics').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('event_type', 'contact_click').gte('created_at', monthAgo.toISOString())
    ])

    setAnalytics({
      totalViews: totalViewsRes.count ?? 0,
      totalContactClicks: totalContactRes.count ?? 0,
      viewsToday: viewsTodayRes.count ?? 0,
      contactClicksToday: contactTodayRes.count ?? 0,
      viewsThisWeek: viewsWeekRes.count ?? 0,
      contactClicksThisWeek: contactWeekRes.count ?? 0,
      viewsThisMonth: viewsMonthRes.count ?? 0,
      contactClicksThisMonth: contactMonthRes.count ?? 0
    })
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Statistics & Analytics</h1>
              <p className="text-xs text-gray-500">Track your club's performance and visitor engagement</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/company')}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Back to Dashboard
          </button>
        </div>

        {loadError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            {loadError}
          </div>
        )}

        {/* Profile Views */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">Profile Views</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">All time</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalViews}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total views</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">This month</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.viewsThisMonth}</p>
              <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last 7 days</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.viewsThisWeek}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                <span className="text-emerald-600 font-semibold">{analytics.viewsToday}</span> today
              </p>
            </div>
          </div>
        </div>

        {/* Contact Clicks */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4 text-brand" />
            </div>
            <p className="text-sm font-bold text-gray-800">Contact Button Clicks</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">All time</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalContactClicks}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total clicks</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">This month</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.contactClicksThisMonth}</p>
              <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
            </div>
            <div className="border border-gray-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last 7 days</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.contactClicksThisWeek}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                <span className="text-brand font-semibold">{analytics.contactClicksToday}</span> today
              </p>
            </div>
          </div>
        </div>

        {/* No data hint */}
        {analytics.totalViews === 0 && analytics.totalContactClicks === 0 && !loadError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-amber-900 mb-1">No statistics yet</p>
            <p className="text-xs text-amber-800">
              Numbers will appear here once visitors view your club profile or click the contact button. Complete your profile and activate your ad to get more visibility.
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">Tips to improve your stats</p>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold shrink-0">→</span>
              Complete your club profile to rank higher in search
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold shrink-0">→</span>
              Add high-quality photos of your venue and keep your model roster updated
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold shrink-0">→</span>
              Respond quickly to inquiries for better engagement
            </li>
          </ul>
        </div>

      </div>
    </div>
  )
}
