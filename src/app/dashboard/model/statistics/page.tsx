'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, MousePointerClick, TrendingUp, Calendar, Phone, Mail, Globe } from 'lucide-react'

interface ProfileStats {
  total_views: number
  total_unique_views: number
  phone_clicks: number
  whatsapp_clicks: number
  viber_clicks: number
  telegram_clicks: number
  email_clicks: number
  website_clicks: number
  search_appearances: number
  favorites_count: number
  last_viewed_at: string | null
}

interface DailyStats {
  date: string
  views: number
  unique_views: number
  phone_clicks: number
  email_clicks: number
  website_clicks: number
}

interface OrderStats {
  totalOrders: number
  totalSpent: number
  activeAds: number
  pendingOrders: number
}

export default function StatisticsPage() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null)
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    totalSpent: 0,
    activeAds: 0,
    pendingOrders: 0
  })
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [dateRange, setDateRange] = useState('month')

  useEffect(() => {
    loadStatistics()
  }, [dateRange])

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load profile statistics
      const { data: profileStatsData, error: profileStatsError } = await supabase
        .from('profile_statistics')
        .select('*')
        .eq('profile_id', user.id)
        .single()

      if (profileStatsError && profileStatsError.code !== 'PGRST116') {
        console.error('Profile stats error:', profileStatsError)
      } else {
        setProfileStats(profileStatsData)
      }

      // Calculate date range for daily stats
      let startDate = new Date()
      switch (dateRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      // Load daily statistics
      const { data: dailyStatsData, error: dailyStatsError } = await supabase
        .from('daily_statistics')
        .select('*')
        .eq('profile_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(30)

      if (dailyStatsError) {
        console.error('Daily stats error:', dailyStatsError)
      } else {
        setDailyStats(dailyStatsData || [])
      }

      // Load order statistics
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)

      if (ordersError) {
        console.error('Orders error:', ordersError)
      } else {
        const totalOrders = orders?.length || 0
        const totalSpent = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
        const activeAds = orders?.filter(order => order.status === 'paid').length || 0
        const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0

        setOrderStats({
          totalOrders,
          totalSpent,
          activeAds,
          pendingOrders
        })
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalContactClicks = () => {
    if (!profileStats) return 0
    return (
      profileStats.phone_clicks +
      profileStats.whatsapp_clicks +
      profileStats.viber_clicks +
      profileStats.telegram_clicks +
      profileStats.email_clicks +
      profileStats.website_clicks
    )
  }

  const getViewsInPeriod = () => {
    return dailyStats.reduce((sum, day) => sum + day.views, 0)
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle 
  }: { 
    title: string
    value: number | string
    icon: any
    color: string
    subtitle?: string
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-600 uppercase">{title}</h3>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  )

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 ml-[280px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 ml-[280px] bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8" />
            Statistics
          </h1>
          <p className="text-gray-600 mt-2">Track your profile performance and activity</p>
        </div>

        {/* Date Range Filter */}
        <div className="mb-8">
          <div className="inline-flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setDateRange('week')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                dateRange === 'week'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                dateRange === 'month'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                dateRange === 'year'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Last Year
            </button>
          </div>
        </div>

        {/* Profile Statistics */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Views"
              value={profileStats?.total_views || 0}
              icon={Eye}
              color="bg-blue-500"
              subtitle="All time profile views"
            />
            <StatCard
              title="Unique Visitors"
              value={profileStats?.total_unique_views || 0}
              icon={Eye}
              color="bg-green-500"
              subtitle="Unique profile visitors"
            />
            <StatCard
              title="Contact Clicks"
              value={getTotalContactClicks()}
              icon={MousePointerClick}
              color="bg-purple-500"
              subtitle="Phone, Email, WhatsApp, etc."
            />
            <StatCard
              title="Search Appearances"
              value={profileStats?.search_appearances || 0}
              icon={TrendingUp}
              color="bg-orange-500"
              subtitle="Times shown in search"
            />
          </div>
        </div>

        {/* Period Statistics */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Statistics for Selected Period
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Views in Period"
              value={getViewsInPeriod()}
              icon={Calendar}
              color="bg-indigo-500"
              subtitle={`Last ${dateRange === 'week' ? '7 days' : dateRange === 'month' ? '30 days' : 'year'}`}
            />
            <StatCard
              title="Active Ads"
              value={orderStats.activeAds}
              icon={TrendingUp}
              color="bg-pink-500"
              subtitle="Currently running"
            />
            <StatCard
              title="Pending Orders"
              value={orderStats.pendingOrders}
              icon={Calendar}
              color="bg-yellow-500"
              subtitle="Awaiting payment"
            />
          </div>
        </div>

        {/* Contact Methods Performance */}
        {profileStats && getTotalContactClicks() > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Methods Performance</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="space-y-4">
                {profileStats.phone_clicks > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700 font-medium">Phone Clicks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(profileStats.phone_clicks / getTotalContactClicks() * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">
                        {profileStats.phone_clicks}
                      </span>
                    </div>
                  </div>
                )}

                {profileStats.whatsapp_clicks > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      <span className="text-gray-700 font-medium">WhatsApp Clicks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(profileStats.whatsapp_clicks / getTotalContactClicks() * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">
                        {profileStats.whatsapp_clicks}
                      </span>
                    </div>
                  </div>
                )}

                {profileStats.email_clicks > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700 font-medium">Email Clicks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${(profileStats.email_clicks / getTotalContactClicks() * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">
                        {profileStats.email_clicks}
                      </span>
                    </div>
                  </div>
                )}

                {profileStats.website_clicks > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700 font-medium">Website Clicks</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${(profileStats.website_clicks / getTotalContactClicks() * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">
                        {profileStats.website_clicks}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Daily Activity */}
        {dailyStats.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Daily Activity</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Views</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Unique</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Contacts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.slice(0, 10).map((day) => (
                      <tr key={day.date} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {new Date(day.date).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right font-semibold">
                          {day.views}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">
                          {day.unique_views}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">
                          {day.phone_clicks + day.email_clicks + day.website_clicks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Boost Visibility Card */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 shadow-sm text-white">
          <h3 className="text-lg font-bold mb-2">Boost Your Visibility</h3>
          <p className="text-pink-100 mb-6">
            Increase your profile views and contact clicks by activating ads and banners
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a 
              href="/dashboard/model/activate-ad"
              className="block px-4 py-3 bg-white text-pink-600 rounded-lg font-semibold hover:bg-pink-50 transition-all text-center"
            >
              Activate Ad Package
            </a>
            <button 
              type="button"
              aria-disabled="true"
              className="block px-4 py-3 bg-white/10 border border-white/40 text-white/80 rounded-lg font-semibold cursor-not-allowed text-center text-sm tracking-wide"
            >
              Buy Banner · Coming soon
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
          <h4 className="text-sm font-bold text-blue-900 mb-2">About Statistics</h4>
          <p className="text-sm text-blue-800">
            Statistics are tracked automatically when visitors view your profile or click on contact methods. 
            Data is updated in real-time. To increase your statistics, keep your profile updated and activate ads regularly.
          </p>
        </div>
      </div>
    </div>
  )
}
