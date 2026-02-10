'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, MousePointerClick, TrendingUp, Heart, Share2 } from 'lucide-react'

interface ModelStats {
  total_profile_views: number
  total_contact_views: number
  total_favorites: number
  total_shares: number
}

interface DailyStats {
  date: string
  profile_views: number
  contact_views: number
  favorites: number
  shares: number
}

type DateRange = 'all' | 'week' | 'month' | 'year'

export default function StatisticsPage() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [modelStats, setModelStats] = useState<ModelStats | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [dateRange, setDateRange] = useState<DateRange>('all')

  useEffect(() => {
    loadStatistics()
  }, [dateRange])

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load model statistics summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('model_statistics_summary')
        .select('*')
        .eq('model_id', user.id)
        .single()

      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error('Summary stats error:', summaryError)
      } else if (summaryData) {
        setModelStats(summaryData)
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
      const dailyQuery = supabase
        .from('model_statistics_daily')
        .select('*')
        .eq('model_id', user.id)
        .order('date', { ascending: false })
        .limit(30)

      if (dateRange !== 'all') {
        dailyQuery.gte('date', startDate.toISOString().split('T')[0])
      }

      const { data: dailyStatsData, error: dailyStatsError } = await dailyQuery

      if (dailyStatsError) {
        console.error('Daily stats error:', dailyStatsError)
      } else {
        setDailyStats(dailyStatsData || [])
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getViewsInPeriod = () => {
    if (dateRange === 'all') {
      return modelStats?.total_profile_views || 0
    }
    return dailyStats.reduce((sum, day) => sum + day.profile_views, 0)
  }

  const getContactViewsInPeriod = () => {
    if (dateRange === 'all') {
      return modelStats?.total_contact_views || 0
    }
    return dailyStats.reduce((sum, day) => sum + day.contact_views, 0)
  }

  const getFavoritesInPeriod = () => {
    if (dateRange === 'all') {
      return modelStats?.total_favorites || 0
    }
    return dailyStats.reduce((sum, day) => sum + day.favorites, 0)
  }

  const getSharesInPeriod = () => {
    if (dateRange === 'all') {
      return modelStats?.total_shares || 0
    }
    return dailyStats.reduce((sum, day) => sum + day.shares, 0)
  }

  const getRangeLabel = () => {
    switch (dateRange) {
      case 'week':
        return 'Last 7 days'
      case 'month':
        return 'Last 30 days'
      case 'year':
        return 'Last year'
      default:
        return 'All time'
    }
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
              onClick={() => setDateRange('all')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                dateRange === 'all'
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Time
            </button>
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

        {/* Statistics */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Statistics · {getRangeLabel()}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Profile Views"
              value={getViewsInPeriod()}
              icon={Eye}
              color="bg-blue-500"
              subtitle={getRangeLabel()}
            />
            <StatCard
              title="Contact Views"
              value={getContactViewsInPeriod()}
              icon={MousePointerClick}
              color="bg-purple-500"
              subtitle={getRangeLabel()}
            />
            <StatCard
              title="Favorites"
              value={getFavoritesInPeriod()}
              icon={Heart}
              color="bg-pink-500"
              subtitle={getRangeLabel()}
            />
            <StatCard
              title="Shares"
              value={getSharesInPeriod()}
              icon={Share2}
              color="bg-indigo-500"
              subtitle={getRangeLabel()}
            />
          </div>
        </div>

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
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Favorites</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Shares</th>
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
                          {day.profile_views}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">
                          {day.unique_visitors}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">
                          {day.contact_views}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">
                          {day.favorites}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">
                          {day.shares}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!modelStats && !loading && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
            <h4 className="text-sm font-bold text-yellow-900 mb-2">No Statistics Yet</h4>
            <p className="text-sm text-yellow-800">
              Your statistics will appear here once visitors start viewing your profile. 
              Make sure your profile is complete and active to start receiving views!
            </p>
          </div>
        )}

        {/* Info Box */}
        {modelStats && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h4 className="text-sm font-bold text-blue-900 mb-2">About Statistics</h4>
            <p className="text-sm text-blue-800">
              Statistics are tracked automatically when visitors view your profile, click "Show Contact", save to favorites, or share your profile. 
              Data updates in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
