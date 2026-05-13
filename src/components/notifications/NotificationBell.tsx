'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'

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

interface NotificationBellProps {
  userRole?: 'model' | 'company' | 'admin' | 'user'
}

export default function NotificationBell({ userRole = 'model' }: NotificationBellProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('components.notificationBell')
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const unreadKey = ['notifications-unread', user?.id] as const
  const listKey = ['notifications-dropdown', user?.id] as const

  const invalidateNotifs = () => {
    if (!user?.id) return
    void queryClient.invalidateQueries({ queryKey: ['notifications-unread', user.id] })
    void queryClient.invalidateQueries({ queryKey: ['notifications-dropdown', user.id] })
  }

  const { data: unreadCount = 0 } = useQuery({
    queryKey: unreadKey,
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<number> => {
      const supabase = createClient()
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false)

      if (error) throw error
      return count ?? 0
    },
  })

  const {
    data: notifications = [],
    isLoading: loading,
  } = useQuery({
    queryKey: listKey,
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<Notification[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, type, title, message, is_read, related_entity_type, related_entity_id, action_url, created_at, read_at',
        )
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return (data as Notification[]) || []
    },
  })

  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking as read:', error)
        return
      }

      invalidateNotifs()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.error('Error deleting notification:', error)
        return
      }

      invalidateNotifs()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    if (notification.action_url) {
      router.push(notification.action_url)
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'club_invite':
        return '🏢'
      case 'collaboration_invite':
        return '🤝'
      case 'collaboration_accepted':
        return '✨'
      case 'verification_approved':
        return '✅'
      case 'verification_rejected':
        return '❌'
      case 'new_comment':
        return '💬'
      case 'photo_like':
        return '❤️'
      case 'system_message':
        return '📢'
      default:
        return '🔔'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 md:left-0 md:right-auto mt-2 w-[calc(100vw-1rem)] max-w-sm md:w-96 md:max-w-none bg-white rounded-xl shadow-2xl border border-gray-200 z-40 max-h-[80vh] md:max-h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{t('title')}</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-gray-500">{t('unread', { count: unreadCount })}</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-2"></div>
                  {t('loading')}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">{t('emptyTitle')}</p>
                  <p className="text-sm mt-1">{t('emptySubtitle')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-all cursor-pointer relative group ${
                        !notification.is_read ? 'bg-pink-50/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-semibold ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                            }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.created_at).toLocaleString(locale, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="p-1 hover:bg-green-100 rounded text-green-600"
                              title={t('markRead')}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title={t('delete')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    const url = userRole === 'model'
                      ? '/dashboard/model/notifications'
                      : userRole === 'company'
                        ? '/dashboard/company/notifications'
                        : '/dashboard/user/notifications'
                    router.push(url)
                    setIsOpen(false)
                  }}
                  className="w-full text-center text-sm font-medium text-pink-600 hover:text-pink-700"
                >
                  {t('viewAll')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
