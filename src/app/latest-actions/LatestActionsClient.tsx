'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new_model', label: 'New Models' },
  { value: 'new_club', label: 'New Clubs' },
  { value: 'new_photo', label: 'Photos' },
  { value: 'new_video', label: 'Videos' },
  { value: 'new_comment', label: 'Comments' },
  { value: 'new_banner', label: 'Banners' },
  { value: 'model_verified', label: 'Verified' },
]

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

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
  const [filter, setFilter] = useState<FilterType>('all')
  const [visibleCount, setVisibleCount] = useState(30)

  const filtered = filter === 'all' ? actions : actions.filter(a => a.action_type === filter)
  const visible = filtered.slice(0, visibleCount)

  const statBoxes = [
    { label: 'Models', value: stats.models, icon: Users, color: '#EC4899', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.2)' },
    { label: 'Clubs', value: stats.clubs, icon: Building2, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
    { label: 'Photos', value: stats.photos, icon: Camera, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)' },
    { label: 'Videos', value: stats.videos, icon: Video, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    { label: 'Reviews', value: stats.comments, icon: MessageSquare, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    { label: 'Banners', value: stats.banners, icon: Megaphone, color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 370px, #1f2126 370px)' }}>
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="text-white/60 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Latest Actions</h1>
        </div>
        <p className="text-sm text-white/60 mb-8 ml-8">Everything happening on nicemodels.ch</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {statBoxes.map(stat => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-xl p-4 text-center transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${stat.border}`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                  style={{ background: stat.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
          <Filter className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
          {FILTER_OPTIONS.map(opt => {
            const isActive = filter === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => { setFilter(opt.value); setVisibleCount(30) }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  background: isActive ? 'rgba(236,72,153,0.9)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                  border: isActive ? '1px solid rgba(236,72,153,0.6)' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {opt.label}
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
          <div className="text-center py-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>No actions yet</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Activity will appear here as things happen on the site</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(action => {
              const config = ACTION_CONFIG[action.action_type] || ACTION_CONFIG.new_model
              const Icon = config.icon
              const link = getActionLink(action)

              const content = (
                <div
                  className="rounded-xl p-4 flex items-center gap-4 transition-all group"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid rgba(255,255,255,0.07)`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = config.border
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
                  }}
                >
                  {/* Actor photo or icon */}
                  <div className="shrink-0">
                    {action.actor?.photoUrl ? (
                      <div
                        className="w-11 h-11 rounded-full overflow-hidden"
                        style={{ border: `2px solid ${config.color}`, boxShadow: `0 0 0 2px #1f2126, 0 0 0 4px ${config.color}` }}
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
                    <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {action.description || action.title}
                    </p>
                    {action.actor && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        by {action.actor.showname || action.actor.username}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {formatTimeAgo(action.created_at)}
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
          <div className="text-center mt-6">
            <button
              onClick={() => setVisibleCount(prev => prev + 30)}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'rgba(236,72,153,0.15)',
                color: '#F472B6',
                border: '1px solid rgba(236,72,153,0.3)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(236,72,153,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(236,72,153,0.15)' }}
            >
              Load More ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {/* Total count */}
        {visible.length > 0 && (
          <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Showing {visible.length} of {filtered.length} actions
          </p>
        )}
      </div>
    </div>
  )
}
