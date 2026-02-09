'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CompanySidebar from '@/components/layout/CompanySidebar'
import { BarChart3, Eye, Users, MessageSquare, Calendar, TrendingUp } from 'lucide-react'

export default function StatisticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [clubDetails, setClubDetails] = useState<any>(null)

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
      setLoading(false)
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <>
        <CompanySidebar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <CompanySidebar />
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

          {/* Beta Notice */}
          <div className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 rounded-lg p-2">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">📊 Analytics Coming Soon</h3>
                <p className="text-sm text-white/90">
                  We're building detailed analytics for you! Once we launch publicly, you'll see real-time data about your profile views, 
                  model performance, client inquiries, and much more.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Profile Views */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase">7 Days</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
              <p className="text-sm text-gray-600">Profile Views</p>
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <span className="text-green-600 font-semibold">+0%</span>
                <span className="ml-1">vs last week</span>
              </div>
            </div>

            {/* Active Models */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-pink-100 rounded-lg p-3">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase">Total</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
              <p className="text-sm text-gray-600">Active Models</p>
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <button 
                  onClick={() => router.push('/dashboard/company/models')}
                  className="text-pink-600 font-semibold hover:underline"
                >
                  Manage models →
                </button>
              </div>
            </div>

            {/* Inquiries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase">30 Days</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
              <p className="text-sm text-gray-600">Client Inquiries</p>
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <span className="text-green-600 font-semibold">+0%</span>
                <span className="ml-1">vs last month</span>
              </div>
            </div>

            {/* Profile Score */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase">Score</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">45%</h3>
              <p className="text-sm text-gray-600">Profile Strength</p>
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <button 
                  onClick={() => router.push('/dashboard/company/profile/basic-info')}
                  className="text-green-600 font-semibold hover:underline"
                >
                  Complete profile →
                </button>
              </div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Views Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Profile Views Over Time</h3>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Chart coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">Data will appear after launch</p>
                </div>
              </div>
            </div>

            {/* Model Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Top Performing Models</h3>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option>This month</option>
                  <option>Last month</option>
                  <option>All time</option>
                </select>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Model stats coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">Track individual performance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Traffic Sources</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Direct / Organic</p>
                    <p className="text-xs text-gray-500">Search engines & direct visits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">visits</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Social Media</p>
                    <p className="text-xs text-gray-500">Facebook, Instagram, Twitter</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">visits</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Referrals</p>
                    <p className="text-xs text-gray-500">Other websites & links</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">visits</p>
                </div>
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
    </>
  )
}
