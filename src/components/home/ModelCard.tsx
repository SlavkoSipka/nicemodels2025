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
    public_id?: number | null
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
    const raw = (details?.about_me || '').replace(/<[^>]*>/g, '')
    return raw.length > 200 ? raw.slice(0, 200).trimEnd() + '…' : raw
  })()
  const ago = timeAgo(model.created_at)

  return (
    <Link
      href={`/models/${model.id}`}
      onClick={() => trackProfileView(model.id)}
      className="block group w-full"
    >
      <div
        className="overflow-hidden flex flex-row w-full transition-all duration-300"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.02)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform  = 'translateY(-2px)'
          el.style.boxShadow  = '0 8px 28px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)'
          el.style.borderColor = 'rgba(236,72,153,0.18)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform  = 'translateY(0)'
          el.style.boxShadow  = '0 1px 3px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.02)'
          el.style.borderColor = 'rgba(0,0,0,0.06)'
        }}
      >
        {/* Photo */}
        <div
          className="relative flex-shrink-0 overflow-hidden"
          style={{ width: '36%', minWidth: 120, aspectRatio: '3/4', background: '#f1f5f9' }}
        >
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
              className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-8 h-8" style={{ color: '#cbd5e1' }} />
            </div>
          )}

          {/* ID badge */}
          {model.public_id && (
            <span
              className="absolute top-2 left-2 text-[9px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', fontFamily: 'monospace' }}
            >
              #{model.public_id}
            </span>
          )}

          {/* Time badge */}
          {ago && (
            <span
              className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.50)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}
            >
              {ago}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Thin blue accent line at top */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, #89CFF0, #bae6fd)', flexShrink: 0 }} />

          <div className="px-4 py-3.5 flex flex-col gap-1.5 flex-1">
            {/* Premium tag */}
            <span
              className="text-[9px] font-bold uppercase tracking-[0.12em] self-start px-2 py-0.5 rounded-full"
              style={{ background: '#fce7f3', color: '#be185d' }}
            >
              Premium
            </span>

            {/* Name */}
            <h3
              className="font-bold text-[15px] sm:text-base leading-snug transition-colors group-hover:text-pink-500"
              style={{ color: '#1a1a2e' }}
            >
              {title}
            </h3>

            {/* City + Age */}
            {(city || age) && (
              <p className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>
                {[city, age].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* Description */}
            {description ? (
              <p className="text-[13px] leading-relaxed flex-1" style={{ color: '#64748b' }}>
                {description}
              </p>
            ) : <div className="flex-1" />}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                {tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium px-2 py-0.5 rounded"
                    style={{ background: '#e8f4fd', color: '#0284c7' }}
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
