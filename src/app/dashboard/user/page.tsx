import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Home, Heart, MessageSquare, TrendingUp } from 'lucide-react'

export default async function UserDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch favorites count
  const { count: favoritesCount } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Fetch comments count
  const { count: commentsCount } = await supabase
    .from('model_comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="ml-[280px] min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.username || 'User'}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your account
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Favorites Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-100 rounded-lg">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{favoritesCount || 0}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Favorites</h3>
            <p className="text-xs text-gray-500">Saved models & clubs</p>
          </div>

          {/* Comments Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{commentsCount || 0}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Comments</h3>
            <p className="text-xs text-gray-500">Your reviews</p>
          </div>

          {/* Profile Views Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">0</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Activity</h3>
            <p className="text-xs text-gray-500">Recent interactions</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/"
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg group-hover:from-pink-200 group-hover:to-rose-200 transition-all">
                <Home className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                  Browse Models
                </h3>
                <p className="text-sm text-gray-500">Discover new profiles</p>
              </div>
            </a>

            <a
              href="/dashboard/user/favorites"
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg group-hover:from-pink-200 group-hover:to-rose-200 transition-all">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                  View Favorites
                </h3>
                <p className="text-sm text-gray-500">See your saved profiles</p>
              </div>
            </a>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-sm p-6 border border-pink-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome to Nice Models! 🎉
          </h2>
          <p className="text-gray-700 mb-4">
            Your account is active and ready to use. Start exploring our platform by browsing models, 
            saving your favorites, and leaving reviews to help other users.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Account Status: <span className="font-semibold text-green-600">Active</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
