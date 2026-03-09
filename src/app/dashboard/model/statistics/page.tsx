'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart2, Eye, MousePointerClick, Heart, Share2 } from 'lucide-react'

interface ModelStats { total_profile_views: number; total_contact_views: number; total_favorites: number; total_shares: number }
interface DailyStats { date: string; profile_views: number; contact_views: number; favorites: number; shares: number }
type DateRange = 'all' | 'week' | 'month' | 'year'

export default function StatisticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [modelStats, setModelStats] = useState<ModelStats | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [dateRange, setDateRange] = useState<DateRange>('all')

  useEffect(() => { loadStatistics() }, [dateRange])

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: summary } = await supabase.from('model_statistics_summary').select('*').eq('model_id', user.id).single()
      if (summary) setModelStats(summary)
      let startDate = new Date()
      if (dateRange === 'week') startDate.setDate(startDate.getDate() - 7)
      else if (dateRange === 'month') startDate.setMonth(startDate.getMonth() - 1)
      else if (dateRange === 'year') startDate.setFullYear(startDate.getFullYear() - 1)
      const q = supabase.from('model_statistics_daily').select('*').eq('model_id', user.id).order('date', { ascending: false }).limit(30)
      if (dateRange !== 'all') q.gte('date', startDate.toISOString().split('T')[0])
      const { data: daily } = await q
      setDailyStats(daily || [])
    } catch { }
    finally { setLoading(false) }
  }

  const getVal = (key: keyof ModelStats, dailyKey: keyof DailyStats) =>
    dateRange === 'all' ? (modelStats?.[key] || 0) : dailyStats.reduce((s, d) => s + (d[dailyKey] as number), 0)

  const rangeLabel = { all: 'All time', week: 'Last 7 days', month: 'Last month', year: 'Last year' }[dateRange]

  const tabBtn = (val: DateRange, label: string) => (
    <button onClick={() => setDateRange(val)}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${dateRange === val ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
      {label}
    </button>
  )

  if (loading) return null

  const stats = [
    { label: 'Profile Views', value: getVal('total_profile_views', 'profile_views'), icon: Eye, color: 'text-blue-600 bg-blue-50' },
    { label: 'Contact Views', value: getVal('total_contact_views', 'contact_views'), icon: MousePointerClick, color: 'text-purple-600 bg-purple-50' },
    { label: 'Favorites', value: getVal('total_favorites', 'favorites'), icon: Heart, color: 'text-brand bg-brand/10' },
    { label: 'Shares', value: getVal('total_shares', 'shares'), icon: Share2, color: 'text-indigo-600 bg-indigo-50' },
  ]

  return (
    <div className="flex-1 p-6 ml-[280px] bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Statistics</h1>
              <p className="text-xs text-gray-500">Track your profile performance</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {tabBtn('all', 'All Time')}
            {tabBtn('week', 'Last 7 Days')}
            {tabBtn('month', 'Last Month')}
            {tabBtn('year', 'Last Year')}
          </div>
        </div>

        {/* Stat cards */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Statistics · {rangeLabel}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{rangeLabel}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Activity table */}
        {dailyStats.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-800">Recent Daily Activity</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Date</th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500">Views</th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500">Contacts</th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500">Favorites</th>
                    <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500">Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyStats.slice(0, 10).map(day => (
                    <tr key={day.date} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-4 text-gray-900">
                        {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{day.profile_views}</td>
                      <td className="py-2.5 px-4 text-right text-gray-600">{day.contact_views}</td>
                      <td className="py-2.5 px-4 text-right text-gray-600">{day.favorites}</td>
                      <td className="py-2.5 px-4 text-right text-gray-600">{day.shares}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!modelStats && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-bold text-amber-900 mb-1">No Statistics Yet</p>
            <p className="text-xs text-amber-700">Your stats will appear once visitors start viewing your profile. Make sure your profile is complete and active!</p>
          </div>
        )}
        {modelStats && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-bold text-blue-900 mb-1">About Statistics</p>
            <p className="text-xs text-blue-700">Stats are tracked when visitors view your profile, click "Show Contact", save to favorites, or share your profile. Updates in real-time.</p>
          </div>
        )}
      </div>
    </div>
  )
}
