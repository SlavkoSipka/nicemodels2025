'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { trackProfileView } from '@/lib/tracking'

interface ModelCardProps {
  model: {
    id: string
    username: string
    created_at?: string
    photoUrl?: string | null
    model_details: {
      showname: string
      city: string
      age: number
      ethnicity: string
      hair_color: string
      about_me?: string
      services_for?: string[]
    } | null
  }
  priority?: boolean
}

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return `vor ${diff} Sek.`
  if (diff < 3600)  return `vor ${Math.floor(diff / 60)} Min.`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`
  return `vor ${Math.floor(diff / 86400)} Tag${Math.floor(diff / 86400) === 1 ? '' : 'en'}`
}

export default function ModelCard({ model, priority = false }: ModelCardProps) {
  const details     = model.model_details
  const title       = details?.showname || model.username
  const city        = details?.city || ''
  const age         = details?.age ? `${details.age} yrs` : ''
  const tags        = details?.services_for?.length ? details.services_for : []
  const description = (() => {
    const raw = details?.about_me || ''
    return raw.length > 220 ? raw.slice(0, 220).trimEnd() + '…' : raw
  })()
  const ago = timeAgo(model.created_at)

  return (
    <Link
      href={`/models/${model.id}`}
      onClick={() => trackProfileView(model.id)}
      className="block group w-full"
    >
      <div
        className="overflow-hidden flex flex-row w-full transition-all duration-200"
        style={{
          background:   '#1f2126',
          borderRadius: '10px',
          border:       '1px solid rgba(59,130,246,0.35)',
          boxShadow:    '0 2px 12px rgba(0,0,0,0.28)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform  = 'translateY(-3px)'
          el.style.boxShadow  = '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.5)'
          el.style.borderColor = 'rgba(59,130,246,0.6)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform  = 'translateY(0)'
          el.style.boxShadow  = '0 2px 12px rgba(0,0,0,0.28)'
          el.style.borderColor = 'rgba(59,130,246,0.35)'
        }}
      >
        {/* ── Photo ─────────────────────────────────────── */}
        <div
          className="relative flex-shrink-0 overflow-hidden"
          style={{ width: '38%', minWidth: 130, aspectRatio: '3/4', background: '#16181d' }}
        >
          {/* pink accent line on photo left edge */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            background: 'linear-gradient(to bottom, #1D4ED8, #3B82F6, #93C5FD)',
            zIndex: 2,
          }} />

          {model.photoUrl ? (
            <Image
              src={model.photoUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 42vw, 22vw"
              priority={priority}
              quality={80}
              placeholder="blur"
              blurDataURL={BLUR}
              className="object-cover object-top group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.15)' }} />
            </div>
          )}

          {/* time badge */}
          {ago && (
            <span
              className="absolute bottom-2 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.85)', zIndex: 3 }}
            >
              {ago}
            </span>
          )}
        </div>

        {/* ── Content ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* blue top strip */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #1D4ED8, #3B82F6, #93C5FD)', flexShrink: 0 }} />

          <div className="px-4 py-3 flex flex-col gap-2 flex-1">
            {/* PREMIUM tag */}
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3B82F6' }}>
              Premium
            </span>

            {/* Name */}
            <h3
              className="font-bold text-base sm:text-lg leading-snug transition-colors"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              {title}
            </h3>

            {/* City · Age */}
            {(city || age) && (
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {[city, age].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* Description */}
            {description ? (
              <p className="text-sm leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {description}
              </p>
            ) : <div className="flex-1" />}

            {/* Service tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                {tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(236,72,153,0.12)', color: '#F472B6', border: '1px solid rgba(236,72,153,0.2)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
