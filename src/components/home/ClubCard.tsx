'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Building2 } from 'lucide-react'

export interface ClubCardData {
  id: string
  display_name: string
  area: string
  city: string
  is_club: boolean
  description: string
  photoUrl: string | null
  canton?: string | null
}

interface ClubCardProps {
  club: ClubCardData
  priority?: boolean
}

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

export default function ClubCard({ club, priority = false }: ClubCardProps) {
  const title = club.display_name || 'Club'
  const location = [club.city, club.area].filter(Boolean).join(' · ')
  const typeLabel = club.is_club ? 'Club' : 'Agency'
  const description = (() => {
    const raw = (club.description || '').replace(/<[^>]*>/g, '')
    return raw.length > 200 ? raw.slice(0, 200).trimEnd() + '…' : raw
  })()

  return (
    <Link href={`/clubs/${club.id}`} className="block group w-full">
      <div
        className="overflow-hidden flex flex-col sm:flex-row w-full transition-all duration-300"
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.02)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = '0 8px 28px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)'
          el.style.borderColor = 'rgba(236,72,153,0.18)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.02)'
          el.style.borderColor = 'rgba(0,0,0,0.06)'
        }}
      >
        {/* Photo */}
        <div
          className="relative flex-shrink-0 overflow-hidden w-full sm:w-[36%] sm:min-w-[120px]"
          style={{ aspectRatio: '3/4', background: '#f1f5f9' }}
        >
          {club.photoUrl ? (
            <Image
              src={club.photoUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 48vw, 22vw"
              priority={priority}
              quality={60}
              placeholder="blur"
              blurDataURL={BLUR}
              className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-8 h-8" style={{ color: '#cbd5e1' }} />
            </div>
          )}

          {/* Type badge */}
          <span
            className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-[8px] sm:text-[9px] font-semibold px-1 sm:px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}
          >
            {typeLabel}
          </span>

          {/* Mobile: name + location overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 sm:hidden p-2 pt-8"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 100%)' }}
          >
            <h3 className="text-white font-bold text-[12px] leading-tight truncate">{title}</h3>
            {location && <p className="text-white/60 text-[10px] mt-0.5 truncate">{location}</p>}
          </div>
        </div>

        {/* Content - desktop only */}
        <div className="flex-1 hidden sm:flex flex-col min-w-0 overflow-hidden">
          <div style={{ height: 2, background: 'linear-gradient(90deg, #60a5fa, #93c5fd)', flexShrink: 0 }} />

          <div className="px-4 py-3.5 flex flex-col gap-1.5 flex-1">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.12em] self-start px-2 py-0.5 rounded-full"
              style={{ background: '#dbeafe', color: '#1d4ed8' }}
            >
              {typeLabel}
            </span>

            <h3
              className="font-bold text-base leading-snug transition-colors group-hover:text-pink-500"
              style={{ color: '#1a1a2e' }}
            >
              {title}
            </h3>

            {location && (
              <p className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>
                {location}
              </p>
            )}

            {description ? (
              <p className="text-[13px] leading-relaxed flex-1" style={{ color: '#64748b' }}>
                {description}
              </p>
            ) : <div className="flex-1" />}
          </div>
        </div>
      </div>
    </Link>
  )
}
