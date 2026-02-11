'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Eye, Calendar, TrendingUp, Phone } from 'lucide-react'

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
  const [clubDetails, setClubDetails] = useState<any>(null)
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

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Load club details
      const { data: clubData } = await supabase
        .from('club_details')
        .select('*')
        .eq('club_id', user.id)
        .single()

      setClubDetails(clubData)

      // Load analytics data
      await loadAnalytics(user.id, supabase)

      setLoading(false)
    }

    loadData()
  }, [router])

  const loadAnalytics = async (clubId: string, supabase: any) => {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Total views
      const { count: totalViews } = await supabase
        .from('club_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('event_type', 'profile_view')

      // Total contact clicks
      const { count: totalContactClicks } = await supabase
        .from('club_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('event_type', 'contact_click')

      // Views today
      const { count: viewsToday } = await supabase
        .from('club_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('event_type', 'profile_view')
        .gte('created_at', today.toISOString())

      // Contact clicks today
      const { count: contactClicksToday } = await supabase
        .from('club_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('event_type', 'contact_click')
        .gte('created_at', today.toISOString())

      // Views this week
      const { count: viewsThisWeek } = await supabase
        .from('club_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('event_type', 'profile_view')
        .gte('created_at', weekAgo.toISOString())

      // Contact clicks this week
      const { count: contactClicksThisWeek } = await supabase
        .from('club_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('event_type', 'contact_click')
        .gte('created_at', weekAgo.toISOString())

      // Views this month
      const { count: viewsThisMonth } = await supabase
        .from('club_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('event_type', 'profile_view')
        .gte('created_at', monthAgo.toISOString())

      // Contact clicks this month
      const { count: contactClicksThisMonth } = await supabase
        .from('club_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('event_type', 'contact_click')
        .gte('created_at', monthAgo.toISOString())

      setAnalytics({
        totalViews: totalViews || 0,
        totalContactClicks: totalContactClicks || 0,
        viewsToday: viewsToday || 0,
        contactClicksToday: contactClicksToday || 0,
        viewsThisWeek: viewsThisWeek || 0,
        contactClicksThisWeek: contactClicksThisWeek || 0,
        viewsThisMonth: viewsThisMonth || 0,
        contactClicksThisMonth: contactClicksThisMonth || 0
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-100 rounded-lg p-2">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Statistics & Analytics</h1>
            </div>
            <p className="text-gray-600">Track your club's performance and visitor engagement</p>
          </div>

          {/* Profile Views Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Profile Views</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Views */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-blue-700 uppercase">All Time</span>
                  <div className="bg-blue-200 rounded-lg p-2">
                    <Eye className="w-5 h-5 text-blue-700" />
                  </div>
                </div>
                <h3 className="text-4xl font-black text-blue-900 mb-1">{analytics.totalViews}</h3>
                <p className="text-sm text-blue-700 font-medium">Total Views</p>
              </div>

              {/* This Month */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-600 uppercase">This Month</span>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-4xl font-black text-gray-900 mb-1">{analytics.viewsThisMonth}</h3>
                <p className="text-sm text-gray-600 font-medium">Profile Views</p>
              </div>

              {/* This Week */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-600 uppercase">Last 7 Days</span>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-4xl font-black text-gray-900 mb-1">{analytics.viewsThisWeek}</h3>
                <p className="text-sm text-gray-600 font-medium">
                  <span className="text-green-600 font-bold">{analytics.viewsToday}</span> today
                </p>
              </div>
            </div>
          </div>

          {/* Contact Clicks Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-pink-600" />
              <h2 className="text-xl font-bold text-gray-900">Contact Button Clicks</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Clicks */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl border-2 border-pink-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-pink-700 uppercase">All Time</span>
                  <div className="bg-pink-200 rounded-lg p-2">
                    <Phone className="w-5 h-5 text-pink-700" />
                  </div>
                </div>
                <h3 className="text-4xl font-black text-pink-900 mb-1">{analytics.totalContactClicks}</h3>
                <p className="text-sm text-pink-700 font-medium">Total Clicks</p>
              </div>

              {/* This Month */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-600 uppercase">This Month</span>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-4xl font-black text-gray-900 mb-1">{analytics.contactClicksThisMonth}</h3>
                <p className="text-sm text-gray-600 font-medium">Contact Clicks</p>
              </div>

              {/* This Week */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-600 uppercase">Last 7 Days</span>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-4xl font-black text-gray-900 mb-1">{analytics.contactClicksThisWeek}</h3>
                <p className="text-sm text-gray-600 font-medium">
                  <span className="text-pink-600 font-bold">{analytics.contactClicksToday}</span> today
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 rounded-lg p-2.5">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">💡 Tips to Improve Your Stats</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">→</span>
                    <span><strong>Complete your profile</strong> to rank higher in search results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">→</span>
                    <span><strong>Add high-quality photos</strong> of your venue and models</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">→</span>
                    <span><strong>Keep your model roster updated</strong> and profiles active</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">→</span>
                    <span><strong>Respond quickly</strong> to client inquiries for better ratings</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
