'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Users, TrendingUp, Calendar, Eye, MessageSquare, Star } from 'lucide-react'

export default function CompanyDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [clubDetails, setClubDetails] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Check if onboarding is completed
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData?.onboarding_completed) {
        // Redirect to onboarding if not completed
        router.push('/onboarding')
        return
      }

      // Fetch club details
      const { data: clubData } = await supabase
        .from('club_details')
        .select('*')
        .eq('club_id', user.id)
        .single()

      // Fetch recent notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setUser(user)
      setProfile(profileData)
      setClubDetails(clubData)
      setNotifications(notifData || [])
      setLoading(false)
    }

    checkUser()
  }, [router])

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

  const clubName = clubDetails?.club_name || clubDetails?.display_name || 'there'
  const clientCode = user?.id?.slice(0, 8).toUpperCase() || 'N/A'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-6xl mx-auto">
          {/* BLOCKED ACCOUNT WARNING */}
          {profile?.is_blocked && (
            <div className="mb-6 bg-red-600 border-4 border-red-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">⛔ Your Account Has Been Blocked</h2>
                    <p className="text-red-100 text-lg mb-3">
                      Your account has been temporarily suspended by our administration team.
                    </p>
                    {profile?.blocked_reason && (
                      <div className="bg-red-700/50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-white mb-1">Reason:</p>
                        <p className="text-red-50">{profile.blocked_reason}</p>
                      </div>
                    )}
                    {profile?.blocked_at && (
                      <p className="text-sm text-red-200 mb-4">
                        Blocked on: {new Date(profile.blocked_at).toLocaleDateString()} at {new Date(profile.blocked_at).toLocaleTimeString()}
                      </p>
                    )}
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                      <p className="text-white font-semibold mb-2">🔒 Restrictions:</p>
                      <ul className="text-red-50 text-sm space-y-1 ml-4">
                        <li>• Your club profile is hidden from search results</li>
                        <li>• Clients cannot view your profile</li>
                        <li>• You cannot receive new messages</li>
                        <li>• Advertising features are disabled</li>
                      </ul>
                    </div>
                    <div className="mt-4 p-4 bg-white rounded-lg">
                      <p className="text-gray-900 font-semibold mb-2">📧 Need help?</p>
                      <p className="text-gray-700 text-sm mb-3">
                        If you believe this is a mistake or want to appeal this decision, please contact our support team.
                      </p>
                      <a 
                        href="mailto:support@nicemodels.ch?subject=Account Blocked - Appeal Request"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contact Support
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, <span className="text-pink-600">{clubName}</span>!
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Your Agency ID: <span className="font-mono font-semibold text-gray-700">{clientCode}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left/Center */}
            <div className="lg:col-span-2 space-y-5">
              {/* Beta Welcome / Free Period */}
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-xl p-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-2">🎉 Welcome to the beta!</h2>
                  <p className="text-sm text-white/90 mb-4">
                    You are among the first clubs/agencies on <span className="font-semibold">nicemodels.ch</span>.
                  </p>
                  <div className="bg-black/15 rounded-lg p-4 border border-white/20 mb-4">
                    <p className="text-sm font-semibold mb-1">Everything is free in the beta phase</p>
                    <p className="text-xs text-white/85">
                      Club profile, model management, visibility features and future ad placements will be <span className="font-bold">100% free</span> 
                      for early agencies while we test and improve the platform.
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-sm text-white/90 mb-5">
                    <li>✓ No prices, no payments during beta</li>
                    <li>✓ Help us test, give feedback and shape the portal</li>
                    <li>✓ We will inform you clearly before any pricing starts</li>
                  </ul>
                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <p className="text-xs text-white/80">
                      Tip: complete your club profile and add models to maximize visibility when we go live.
                    </p>
                    <button
                      className="px-5 py-2 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg text-xs whitespace-nowrap"
                      onClick={() => router.push('/dashboard/company/profile/basic-info')}
                    >
                      Complete profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-pink-600" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => router.push('/dashboard/company/models/create')}
                    className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-100 hover:border-pink-300 transition-all group"
                  >
                    <Users className="w-6 h-6 text-pink-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-gray-900">Add Model</span>
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/company/profile/club-photos')}
                    className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:border-purple-300 transition-all group"
                  >
                    <svg className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">Upload Photos</span>
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/company/profile/working-hours')}
                    className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-all group"
                  >
                    <Calendar className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-gray-900">Set Hours</span>
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/company/statistics')}
                    className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-100 hover:border-orange-300 transition-all group"
                  >
                    <TrendingUp className="w-6 h-6 text-orange-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-gray-900">View Stats</span>
                  </button>
                </div>
              </div>

              {/* Recent Notifications */}
              {notifications.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Recent Notifications
                    </h3>
                    <button
                      onClick={() => router.push('/dashboard/company/notifications')}
                      className="text-sm text-pink-600 hover:text-pink-700 font-semibold"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:border-pink-300 transition-all ${
                          !notif.is_read ? 'bg-pink-50/50 border-pink-200' : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => router.push(notif.action_url || '/dashboard/company/notifications')}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">
                            {notif.type === 'club_invite' ? '🏢' : 
                             notif.type === 'verification_approved' ? '✅' : '📢'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900">{notif.title}</h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Support & Help */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 rounded-lg p-2.5">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900">Need Help?</h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>support@nicemodels.ch</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                    <span>Live chat available 24/7</span>
                  </div>
                </div>
              </div>

              {/* Profile Tips */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 rounded-lg p-2 mt-0.5">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">💡 Agency Tips</h4>
                    <ul className="space-y-1.5 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-pink-500 font-bold">→</span>
                        <span>Complete club profile gets <strong>3x more visibility</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-500 font-bold">→</span>
                        <span>Add high-quality photos of your venue</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-500 font-bold">→</span>
                        <span>Keep your model roster updated regularly</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-5">
              {/* Club Stats */}
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg p-5 text-white">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Club Performance
                </h3>
                <div className="space-y-3">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <div className="text-xs text-white/80 mb-1">Profile Views</div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-white/70 mt-1">Last 7 days</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <div className="text-xs text-white/80 mb-1">Active Models</div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-white/70 mt-1">Visible to clients</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <div className="text-xs text-white/80 mb-1">Inquiries</div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-xs text-white/70 mt-1">This month</div>
                  </div>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">Profile Strength</h3>
                  <span className="text-2xl font-bold text-pink-600">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Basic info added</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Add club photos</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Add at least 1 model</span>
                  </div>
                </div>
              </div>

              {/* Get Featured Promo */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-5 text-white">
                <h4 className="font-bold mb-2">🎯 Stand Out from Competition</h4>
                <p className="text-sm text-gray-300 mb-4">Appear at the top of search results and attract more clients to your venue</p>
                <button className="w-full py-2.5 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 transition-all">
                  Learn More (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

