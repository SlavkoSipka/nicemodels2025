import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Heart, MessageSquare, Home, Search as SearchIcon } from 'lucide-react'
import Link from 'next/link'
import InYourAreaSection from '@/components/dashboard/InYourAreaSection'

export default async function UserDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const [{ count: favoritesCount }, { count: commentsCount }, { count: savedSearchCount }, { count: unreadCount }] = await Promise.all([
    supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('model_comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('saved_searches').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
  ])

  return (
    <div className="ml-0 md:ml-[280px] min-h-screen bg-gray-50">
      <div className="py-4 md:py-6 px-4 md:px-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Welcome back, <span className="text-brand">{profile.username || 'User'}</span>!
              </h1>
              <p className="text-xs text-gray-500">Here's what's happening with your account</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/dashboard/user/favorites"
              className="block bg-white border border-gray-200 rounded-lg p-4 transition-all hover:border-brand hover:shadow-sm hover:bg-brand/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-brand" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{favoritesCount || 0}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700">Favorites</p>
              <p className="text-xs text-gray-400">Saved models & clubs</p>
            </Link>

            <Link
              href="/dashboard/user/comments"
              className="block bg-white border border-gray-200 rounded-lg p-4 transition-all hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{commentsCount || 0}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700">Comments</p>
              <p className="text-xs text-gray-400">Your reviews</p>
            </Link>

            <Link
              href="/dashboard/user/saved-searches"
              className="block bg-white border border-gray-200 rounded-lg p-4 transition-all hover:border-violet-300 hover:shadow-sm hover:bg-violet-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-md bg-violet-50 flex items-center justify-center">
                  <SearchIcon className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{savedSearchCount || 0}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700">Saved searches</p>
              <p className="text-xs text-gray-400">Alerts when matches appear</p>
            </Link>

            <Link
              href="/dashboard/user/notifications"
              className="block bg-white border border-gray-200 rounded-lg p-4 transition-all hover:border-pink-300 hover:shadow-sm hover:bg-pink-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-md bg-pink-50 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{unreadCount || 0}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700">Inbox</p>
              <p className="text-xs text-gray-400">Unread notifications</p>
            </Link>
          </div>

          {/* In your area */}
          <InYourAreaSection originCity={profile.city || null} />

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-bold text-gray-800 mb-3">Quick Actions</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/"
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-brand/5 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center group-hover:bg-brand/20">
                  <Home className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-brand">Browse Models</p>
                  <p className="text-xs text-gray-500">Discover new profiles</p>
                </div>
              </Link>

              <Link href="/dashboard/user/favorites"
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-brand/5 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center group-hover:bg-brand/20">
                  <Heart className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-brand">View Favorites</p>
                  <p className="text-xs text-gray-500">See your saved profiles</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Account notice */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900 mb-0.5">Account Status: <span className="text-emerald-600">Active</span></p>
                <p className="text-xs text-gray-500">
                  Your account is ready to use. Browse models, save favorites, and leave reviews to help other users.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
