'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  Users, Building2, Camera, Video, MessageSquare, Megaphone,
  BadgeCheck, ChevronLeft, Filter, Sparkles
} from 'lucide-react'

interface SiteAction {
  id: string
  action_type: string
  actor_id: string | null
  target_id: string | null
  target_type: string | null
  title: string
  description: string | null
  metadata: any
  created_at: string
  actor: {
    username: string
    showname?: string
    photoUrl?: string
  } | null
}

interface Stats {
  models: number
  clubs: number
  photos: number
  videos: number
  comments: number
  banners: number
}

type FilterType = 'all' | 'new_model' | 'new_club' | 'new_photo' | 'new_video' | 'new_comment' | 'new_banner' | 'model_verified'

const ACTION_CONFIG: Record<string, { icon: typeof Users; color: string; bg: string; border: string; emoji: string }> = {
  new_model: {
    icon: Users,
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.12)',
    border: 'rgba(236,72,153,0.25)',
    emoji: '👩',
  },
  new_club: {
    icon: Building2,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.25)',
    emoji: '🏢',
  },
  new_photo: {
    icon: Camera,
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.25)',
    emoji: '📸',
  },
  new_video: {
    icon: Video,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    emoji: '🎬',
  },
  new_comment: {
    icon: MessageSquare,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
    emoji: '💬',
  },
  new_banner: {
    icon: Megaphone,
    color: '#F97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.25)',
    emoji: '📢',
  },
  model_verified: {
    icon: BadgeCheck,
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.25)',
    emoji: '✅',
  },
}

const FILTER_KEYS: { value: FilterType; key: string }[] = [
  { value: 'all', key: 'all' },
  { value: 'new_model', key: 'newModels' },
  { value: 'new_club', key: 'newClubs' },
  { value: 'new_photo', key: 'photos' },
  { value: 'new_video', key: 'videos' },
  { value: 'new_comment', key: 'comments' },
  { value: 'new_banner', key: 'banners' },
  { value: 'model_verified', key: 'verified' },
]

function formatTimeAgo(
  dateStr: string,
  t: (key: string, values?: Record<string, unknown>) => string,
): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('justNow')
  if (minutes < 60) return t('minutesAgo', { n: minutes })

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hoursAgo', { n: hours })

  const days = Math.floor(hours / 24)
  if (days < 7) return t('daysAgo', { n: days })

  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function getActionLink(action: SiteAction): string | null {
  if (action.action_type === 'new_model' || action.action_type === 'model_verified') {
    return action.actor_id ? `/models/${action.actor_id}` : null
  }
  if (action.action_type === 'new_club') {
    return action.actor_id ? `/clubs/${action.actor_id}` : null
  }
  if (action.action_type === 'new_photo' || action.action_type === 'new_video') {
    const modelId = action.metadata?.model_id || action.actor_id
    return modelId ? `/models/${modelId}` : null
  }
  if (action.action_type === 'new_comment') {
    const modelId = action.metadata?.model_id
    return modelId ? `/models/${modelId}` : null
  }
  return null
}

export default function LatestActionsClient({ actions, stats }: { actions: SiteAction[]; stats: Stats }) {
  const t = useTranslations('latestActions')
  const tStats = useTranslations('latestActions.stats')
  const tFilters = useTranslations('latestActions.filters')
  const tEmpty = useTranslations('latestActions.empty')
  const tTime = useTranslations('latestActions.time')
  const [filter, setFilter] = useState<FilterType>('all')
  const [visibleCount, setVisibleCount] = useState(30)

  const filtered = filter === 'all' ? actions : actions.filter(a => a.action_type === filter)
  const visible = filtered.slice(0, visibleCount)

  const statBoxes = [
    { label: tStats('models'),  value: stats.models,   icon: Users },
    { label: tStats('clubs'),   value: stats.clubs,    icon: Building2 },
    { label: tStats('photos'),  value: stats.photos,   icon: Camera },
    { label: tStats('videos'),  value: stats.videos,   icon: Video },
    { label: tStats('reviews'), value: stats.comments, icon: MessageSquare },
    { label: tStats('banners'), value: stats.banners,  icon: Megaphone },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#fce9f3' }}>
      <div className="max-w-7xl mx-auto px-3 py-5 sm:px-4 sm:py-10">

        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Link href="/" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{t('title')}</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mb-5 ml-7 sm:mb-8 sm:ml-8">{t('subtitle')}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-5 sm:mb-8">
          {statBoxes.map(stat => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-xl p-3 sm:p-4 text-center transition-all hover:scale-[1.02]"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(59,130,246,0.20)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                }}
              >
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2"
                  style={{ background: 'rgba(236,72,153,0.10)' }}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#EC4899' }} />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#94a3b8' }}>{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-1 px-1">
          <Filter className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />
          {FILTER_KEYS.map(opt => {
            const isActive = filter === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => { setFilter(opt.value); setVisibleCount(30) }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  background: isActive ? '#EC4899' : '#ffffff',
                  color: isActive ? '#fff' : '#475569',
                  border: isActive ? '1px solid rgba(236,72,153,0.6)' : '1px solid rgba(0,0,0,0.12)',
                }}
              >
                {tFilters(opt.key)}
                {opt.value !== 'all' && (
                  <span className="ml-1 opacity-60">
                    {actions.filter(a => a.action_type === opt.value).length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Actions Feed */}
        {visible.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(12,53,71,0.15)' }}>
            <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(12,53,71,0.20)' }} />
            <p className="text-base sm:text-lg font-semibold" style={{ color: '#475569' }}>{tEmpty('title')}</p>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>{tEmpty('subtitle')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(action => {
              const config = ACTION_CONFIG[action.action_type] || ACTION_CONFIG.new_model
              const Icon = config.icon
              const link = getActionLink(action)

              const content = (
                <div
                  className="rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all group"
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(59,130,246,0.15)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = '#f8fbff'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = config.border
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = '#ffffff'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.15)'
                  }}
                >
                  {/* Actor photo or icon */}
                  <div className="shrink-0">
                    {action.actor?.photoUrl ? (
                      <div
                        className="w-11 h-11 rounded-full overflow-hidden"
                        style={{ border: `2px solid ${config.color}`, boxShadow: `0 0 0 2px #ffffff, 0 0 0 4px ${config.color}` }}
                      >
                        <Image
                          src={action.actor.photoUrl}
                          alt={action.actor.showname || action.actor.username}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{ background: config.bg, border: `1px solid ${config.border}` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
                      >
                        {action.action_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: '#0f172a' }}>
                      {action.description || action.title}
                    </p>
                    {action.actor && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#94a3b8' }}>
                        {t('by', { name: action.actor.showname || action.actor.username })}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                      {formatTimeAgo(action.created_at, tTime)}
                    </p>
                  </div>
                </div>
              )

              if (link) {
                return (
                  <Link key={action.id} href={link} className="block">
                    {content}
                  </Link>
                )
              }

              return <div key={action.id}>{content}</div>
            })}
          </div>
        )}

        {/* Load More */}
        {visibleCount < filtered.length && (
          <div className="text-center mt-4 sm:mt-6">
            <button
              onClick={() => setVisibleCount(prev => prev + 30)}
              className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all"
              style={{
                background: 'rgba(236,72,153,0.15)',
                color: '#F472B6',
                border: '1px solid rgba(236,72,153,0.3)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(236,72,153,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(236,72,153,0.15)' }}
            >
              {t('loadMore', { remaining: filtered.length - visibleCount })}
            </button>
          </div>
        )}

        {/* Total count */}
        {visible.length > 0 && (
          <p className="text-center text-xs mt-4" style={{ color: '#94a3b8' }}>
            {t('showing', { visible: visible.length, total: filtered.length })}
          </p>
        )}
      </div>
    </div>
  )
}
