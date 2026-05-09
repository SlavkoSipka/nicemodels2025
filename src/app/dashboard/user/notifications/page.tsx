'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import {
  Bell,
  Check,
  Trash2,
  Camera,
  Film,
  MapPin,
  Sparkles,
  Search as SearchIcon,
  MessageSquare,
  ShieldCheck,
  Users,
  Megaphone,
  Info,
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  related_entity_type: string | null
  related_entity_id: string | null
  action_url: string | null
  created_at: string
  read_at: string | null
}

type TabId = 'all' | 'matches' | 'favorites' | 'system' | 'unread'

const FAV_TYPES = new Set(['fav_new_photo', 'fav_new_story', 'fav_location_change', 'fav_back_online'])
const MATCH_TYPES = new Set(['match_found'])
const SYSTEM_TYPES = new Set([
  'verification_approved',
  'verification_rejected',
  'new_comment',
  'photo_like',
  'system_message',
  'club_invite',
  'collaboration_invite',
  'collaboration_accepted',
])

function categoryOf(type: string): 'matches' | 'favorites' | 'system' {
  if (MATCH_TYPES.has(type)) return 'matches'
  if (FAV_TYPES.has(type)) return 'favorites'
  return 'system'
}

function iconFor(type: string) {
  switch (type) {
    case 'match_found':
      return { Icon: SearchIcon, bg: 'bg-violet-100', fg: 'text-violet-600' }
    case 'fav_new_photo':
      return { Icon: Camera, bg: 'bg-pink-100', fg: 'text-pink-600' }
    case 'fav_new_story':
      return { Icon: Film, bg: 'bg-fuchsia-100', fg: 'text-fuchsia-600' }
    case 'fav_location_change':
      return { Icon: MapPin, bg: 'bg-amber-100', fg: 'text-amber-600' }
    case 'fav_back_online':
      return { Icon: Sparkles, bg: 'bg-emerald-100', fg: 'text-emerald-600' }
    case 'verification_approved':
      return { Icon: ShieldCheck, bg: 'bg-emerald-100', fg: 'text-emerald-600' }
    case 'verification_rejected':
      return { Icon: ShieldCheck, bg: 'bg-red-100', fg: 'text-red-600' }
    case 'new_comment':
      return { Icon: MessageSquare, bg: 'bg-blue-100', fg: 'text-blue-600' }
    case 'photo_like':
      return { Icon: Sparkles, bg: 'bg-pink-100', fg: 'text-pink-600' }
    case 'club_invite':
    case 'collaboration_invite':
    case 'collaboration_accepted':
      return { Icon: Users, bg: 'bg-indigo-100', fg: 'text-indigo-600' }
    case 'system_message':
      return { Icon: Megaphone, bg: 'bg-slate-100', fg: 'text-slate-600' }
    default:
      return { Icon: Info, bg: 'bg-slate-100', fg: 'text-slate-600' }
  }
}

export default function UserNotificationsPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.user.notifications')
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [tab, setTab] = useState<TabId>('all')

  function formatWhen(iso: string): string {
    const date = new Date(iso)
    const diffMs = Date.now() - date.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return t('timeJustNow')
    if (mins < 60) return t('timeMinAgo', { n: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t('timeHourAgo', { n: hours })
    const days = Math.floor(hours / 24)
    if (days < 7) return t('timeDayAgo', { n: days })
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) console.error('Error loading notifications:', error)
      else setNotifications(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
    if (error) return
    setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n)))
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds)
    if (error) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const deleteNotification = async (notificationId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('notifications').delete().eq('id', notificationId)
    if (error) return
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id)
    if (n.action_url) router.push(n.action_url)
  }

  const counts = useMemo(() => {
    const c = { all: notifications.length, unread: 0, matches: 0, favorites: 0, system: 0 }
    for (const n of notifications) {
      if (!n.is_read) c.unread++
      const cat = categoryOf(n.type)
      if (cat === 'matches') c.matches++
      else if (cat === 'favorites') c.favorites++
      else c.system++
    }
    return c
  }, [notifications])

  const filtered = useMemo(() => {
    if (tab === 'all') return notifications
    if (tab === 'unread') return notifications.filter(n => !n.is_read)
    return notifications.filter(n => categoryOf(n.type) === tab)
  }, [notifications, tab])

  if (loading) return null

  const TABS: { id: TabId; label: string; count: number }[] = [
    { id: 'all', label: t('tabAll'), count: counts.all },
    { id: 'unread', label: t('tabUnread'), count: counts.unread },
    { id: 'matches', label: t('tabMatches'), count: counts.matches },
    { id: 'favorites', label: t('tabFavorites'), count: counts.favorites },
    { id: 'system', label: t('tabSystem'), count: counts.system },
  ]

  return (
    <>
      <DashboardSidebar userRole="user" />
      <div className="min-h-screen bg-gray-50 py-6 md:py-8 px-4 md:px-6 ml-0 md:ml-[280px]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-pink-100 rounded-lg p-2">
                  <Bell className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('title')}</h1>
                  {counts.unread > 0 ? (
                    <p className="text-sm text-gray-600 mt-0.5">{t('unreadCount', { count: counts.unread })}</p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-0.5">{t('allCaughtUp')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/user/saved-searches"
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-violet-100 text-violet-700 rounded-lg font-semibold hover:bg-violet-200 transition-all text-sm"
                >
                  <SearchIcon className="w-4 h-4" />
                  {t('savedSearches')}
                </Link>
                {counts.unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-pink-100 text-pink-700 rounded-lg font-semibold hover:bg-pink-200 transition-all text-sm"
                  >
                    <Check className="w-4 h-4" />
                    {t('markAllRead')}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {TABS.map(tt => (
                <button
                  key={tt.id}
                  onClick={() => setTab(tt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    tab === tt.id
                      ? 'bg-pink-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-pink-700'
                  }`}
                >
                  {tt.label}
                  <span className={`ml-1.5 ${tab === tt.id ? 'opacity-80' : 'opacity-60'}`}>{tt.count}</span>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tab === 'unread' ? t('noUnread') : t('nothingHereYet')}
              </h3>
              <p className="text-gray-600 text-sm">
                {tab === 'matches'
                  ? t('matchesEmpty')
                  : tab === 'favorites'
                    ? t('favoritesEmpty')
                    : t('defaultEmpty')}
              </p>
              {tab === 'matches' && (
                <Link
                  href="/dashboard/user/saved-searches/new"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-all text-sm"
                >
                  <SearchIcon className="w-4 h-4" /> {t('createSavedSearch')}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(n => {
                const { Icon, bg, fg } = iconFor(n.type)
                return (
                  <div
                    key={n.id}
                    className={`bg-white rounded-xl border-2 p-4 transition-all cursor-pointer group flex items-start gap-3 ${
                      !n.is_read ? 'border-pink-200 bg-pink-50/30' : 'border-gray-200 hover:border-pink-300'
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className={`w-10 h-10 rounded-full ${bg} ${fg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm md:text-base font-semibold leading-tight ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {n.title}
                        </h3>
                        {!n.is_read && <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1.5">{formatWhen(n.created_at)}</p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {!n.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(n.id) }}
                          className="p-1.5 hover:bg-green-100 rounded-md text-green-600"
                          title={t('markAsRead')}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                        className="p-1.5 hover:bg-red-100 rounded-md text-red-600"
                        title={t('deleteNotif')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
