import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { LayoutDashboard, Heart, MessageSquare, Home, Search as SearchIcon, XCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import InYourAreaSection from '@/components/dashboard/InYourAreaSection'

export default async function UserDashboard() {
  const supabase = await createClient()
  const t = await getTranslations('dashboard.user.home')
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
      <div className="py-3 md:py-6 px-3 md:px-6">
        <div className="max-w-5xl mx-auto space-y-3 md:space-y-4">

          {/* Blocked account */}
          {profile?.is_blocked && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-5">
              <div className="flex items-start gap-2.5 md:gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-800 mb-1">{t('accountSuspended')}</p>
                  <p className="text-xs md:text-sm text-red-700">
                    {t('suspendedMessage')}
                    {profile?.blocked_reason && <span className="block mt-1 font-medium">{profile.blocked_reason}</span>}
                  </p>
                  {profile?.blocked_at && (
                    <p className="text-[11px] md:text-xs text-red-500 mt-1">
                      {new Date(profile.blocked_at).toLocaleDateString()} at {new Date(profile.blocked_at).toLocaleTimeString()}
                    </p>
                  )}
                  <div className="mt-2 md:mt-3 text-[11px] md:text-xs text-red-700 space-y-0.5">
                    <p>{t('suspendedNoComments')}</p>
                    <p>{t('suspendedNoMessages')}</p>
                    <p>{t('suspendedFavoritesPaused')}</p>
                  </div>
                  <a
                    href="mailto:info@nicemodels.ch?subject=Account Blocked - Appeal Request"
                    className="inline-flex items-center gap-1.5 mt-2.5 md:mt-3 text-[11px] md:text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2"
                  >
                    <Mail className="w-3.5 h-3.5" /> {t('contactSupport')}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-4 h-4 text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">
                {t('welcomeBack')}<span className="text-brand">{profile.username || t('welcomeFallback')}</span>
              </h1>
              <p className="text-[11px] md:text-xs text-gray-500 truncate">{t('welcomeSubtitle')}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <Link
              href="/dashboard/user/favorites"
              className="block bg-white border border-gray-200 rounded-lg p-3 md:p-4 transition-all hover:border-brand hover:shadow-sm hover:bg-brand/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <div className="flex items-center justify-between mb-1.5 md:mb-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-brand/10 flex items-center justify-center">
                  <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-gray-900">{favoritesCount || 0}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700">{t('favorites')}</p>
              <p className="text-[11px] md:text-xs text-gray-400 truncate">{t('favoritesHint')}</p>
            </Link>

            <Link
              href="/dashboard/user/comments"
              className="block bg-white border border-gray-200 rounded-lg p-3 md:p-4 transition-all hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center justify-between mb-1.5 md:mb-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-blue-50 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-gray-900">{commentsCount || 0}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700">{t('comments')}</p>
              <p className="text-[11px] md:text-xs text-gray-400 truncate">{t('commentsHint')}</p>
            </Link>

            <Link
              href="/dashboard/user/saved-searches"
              className="block bg-white border border-gray-200 rounded-lg p-3 md:p-4 transition-all hover:border-violet-300 hover:shadow-sm hover:bg-violet-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center justify-between mb-1.5 md:mb-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-violet-50 flex items-center justify-center">
                  <SearchIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-600" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-gray-900">{savedSearchCount || 0}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700">{t('savedSearches')}</p>
              <p className="text-[11px] md:text-xs text-gray-400 truncate">{t('savedSearchesHint')}</p>
            </Link>

            <Link
              href="/dashboard/user/notifications"
              className="block bg-white border border-gray-200 rounded-lg p-3 md:p-4 transition-all hover:border-pink-300 hover:shadow-sm hover:bg-pink-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center justify-between mb-1.5 md:mb-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-pink-50 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                </div>
                <span className="text-xl md:text-2xl font-bold text-gray-900">{unreadCount || 0}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700">{t('inbox')}</p>
              <p className="text-[11px] md:text-xs text-gray-400 truncate">{t('inboxHint')}</p>
            </Link>
          </div>

          {/* In your area */}
          <InYourAreaSection originCity={profile.city || null} />

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
            <p className="text-sm font-bold text-gray-800 mb-2.5 md:mb-3">{t('quickActions')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              <Link href="/"
                className="flex items-center gap-3 p-2.5 md:p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-brand/5 active:bg-brand/10 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center group-hover:bg-brand/20 shrink-0">
                  <Home className="w-4 h-4 text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-brand">{t('browseModels')}</p>
                  <p className="text-[11px] md:text-xs text-gray-500 truncate">{t('browseModelsHint')}</p>
                </div>
              </Link>

              <Link href="/dashboard/user/favorites"
                className="flex items-center gap-3 p-2.5 md:p-3 border border-gray-200 rounded-lg hover:border-brand hover:bg-brand/5 active:bg-brand/10 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center group-hover:bg-brand/20 shrink-0">
                  <Heart className="w-4 h-4 text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-brand">{t('viewFavorites')}</p>
                  <p className="text-[11px] md:text-xs text-gray-500 truncate">{t('viewFavoritesHint')}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Account notice */}
          <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
            <div className="flex items-start gap-2.5 md:gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 mb-0.5">{t('accountStatus')} <span className="text-emerald-600">{t('accountActive')}</span></p>
                <p className="text-[11px] md:text-xs text-gray-500">
                  {t('accountReady')}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
