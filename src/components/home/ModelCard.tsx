'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'
import { trackProfileView } from '@/lib/tracking'
import ViewCount from '@/components/ui/ViewCount'

interface ModelCardProps {
  model: {
    id: string
    username: string
    created_at?: string
    photoUrl?: string | null
    public_id?: number | null
    view_count?: number
    model_details: {
      showname: string
      city: string
      age: number
      ethnicity: string
      hair_color: string
      about_me?: string
      services_for?: string[]
      live_location_city?: string | null
      live_location_postal_code?: string | null
    } | null
  }
  priority?: boolean
}

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

export default function ModelCard({ model, priority = false }: ModelCardProps) {
  const t = useTranslations('components.home.modelCard')
  const [cardHover, setCardHover] = useState(false)
  const details     = model.model_details
  const title       = details?.showname || model.username
  const city        = details?.city || ''
  const age         = details?.age ? t('ageYears', { age: details.age }) : ''
  const tags        = details?.services_for?.length ? details.services_for : []
  const description = (() => {
    const raw = (details?.about_me || '').replace(/<[^>]*>/g, '')
    return raw.length > 200 ? raw.slice(0, 200).trimEnd() + '…' : raw
  })()

  let ago = ''
  if (model.created_at) {
    const diff = Math.floor((Date.now() - new Date(model.created_at).getTime()) / 1000)
    if (diff < 60) ago = t('timeSec', { n: Math.max(diff, 1) })
    else if (diff < 3600) ago = t('timeMin', { n: Math.floor(diff / 60) })
    else if (diff < 86400) ago = t('timeHour', { n: Math.floor(diff / 3600) })
    else ago = t('timeDay', { n: Math.floor(diff / 86400) })
  }

  const liveCity = details?.live_location_city?.trim()
  const liveLine =
    liveCity
      ? details?.live_location_postal_code
        ? t('liveCityPostal', { city: liveCity, postal: details.live_location_postal_code })
        : t('liveCity', { city: liveCity })
      : null

  const cardStyle = {
    background: '#ffffff' as const,
    borderRadius: '12px',
    border: `1px solid ${cardHover ? 'rgba(236,72,153,0.18)' : 'rgba(0,0,0,0.06)'}`,
    boxShadow: cardHover
      ? '0 8px 28px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)'
      : '0 1px 3px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.02)',
    transform: cardHover ? 'translateY(-2px)' : 'translateY(0)',
  }

  return (
    <div
      className="relative block group w-full rounded-[12px]"
      onMouseEnter={() => setCardHover(true)}
      onMouseLeave={() => setCardHover(false)}
    >
      {/* Full-card link behind content; tel/sms sit above with pointer-events-auto */}
      <Link
        href={`/models/${model.id}`}
        onClick={() => trackProfileView(model.id)}
        className="absolute inset-0 z-0 rounded-[12px]"
        aria-label={t('viewProfileAria', { title })}
      />
      <div
        className="relative z-10 pointer-events-none overflow-hidden flex flex-col sm:flex-row w-full transition-all duration-300"
        style={cardStyle}
      >
        {/* Photo */}
        <div
          className="relative flex-shrink-0 overflow-hidden w-full sm:w-[36%] sm:min-w-[120px]"
          style={{ aspectRatio: '3/4', background: '#f1f5f9' }}
        >
          {model.photoUrl ? (
            <Image
              src={model.photoUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 48vw, 22vw"
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


          {/* Time badge */}
          {ago && (
            <span
              className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full sm:bottom-2"
              style={{ background: 'rgba(0,0,0,0.50)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}
            >
              {ago}
            </span>
          )}

          {/* View-count badge */}
          <span className="absolute top-2 left-2">
            <ViewCount count={model.view_count ?? 0} />
          </span>

          {/* Mobile: name + meta overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 sm:hidden p-2 pt-10"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}
          >
            <h3 className="text-white font-bold text-[12px] leading-tight truncate">{title}</h3>
            {(city || age) && (
              <p className="text-white/70 text-[10px] mt-0.5 truncate">
                {[city, age].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Content - desktop only */}
        <div className="flex-1 hidden sm:flex flex-col min-w-0 overflow-hidden">
          {/* Thin blue accent line at top */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, #89CFF0, #bae6fd)', flexShrink: 0 }} />

          <div className="px-4 py-3.5 flex flex-col gap-1.5 flex-1">
            {/* Premium tag */}
            <span
              className="text-[9px] font-bold uppercase tracking-[0.12em] self-start px-2 py-0.5 rounded-full"
              style={{ background: '#fce7f3', color: '#be185d' }}
            >
              {t('premium')}
            </span>

            {/* Name */}
            <h3
              className="font-bold text-[15px] sm:text-base leading-snug transition-colors group-hover:text-pink-500 truncate"
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

            {/* Live location (matches filter / listing styling) */}
            {liveLine && (
              <p
                className="text-[11px] font-semibold flex items-center gap-1.5 leading-snug"
                style={{ color: '#047857' }}
              >
                <span className="relative inline-flex rounded-full h-2 w-2 shrink-0 bg-emerald-500" aria-hidden />
                {liveLine}
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
    </div>
  )
}
