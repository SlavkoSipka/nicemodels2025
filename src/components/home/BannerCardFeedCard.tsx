'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { BannerData } from './BannerCard'

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

interface BannerCardFeedCardProps {
  banner: BannerData
  priority?: boolean
}

/**
 * One grid cell — same shell as ModelCard / ClubCard (photo ~36% + content on sm+)
 * so footprint matches other cards in the 2-column feed.
 */
export default function BannerCardFeedCard({ banner, priority = false }: BannerCardFeedCardProps) {
  if (!banner.image_url) return null

  const href = banner.cta_url || `/${banner.owner_type === 'club' ? 'clubs' : 'models'}/${banner.owner_id}`

  return (
    <Link href={href} className="block group w-full">
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
        <div
          className="relative flex-shrink-0 overflow-hidden w-full sm:w-[36%] sm:min-w-[120px]"
          style={{ aspectRatio: '3/4', background: '#f1f5f9' }}
        >
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            sizes="(max-width: 640px) 48vw, 22vw"
            priority={priority}
            quality={65}
            placeholder="blur"
            blurDataURL={BLUR}
            className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
          />

          <span
            className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(139,92,246,0.85)', color: '#fff', backdropFilter: 'blur(8px)' }}
          >
            Ad
          </span>

          <div
            className="absolute bottom-0 left-0 right-0 sm:hidden p-2 pt-8"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 100%)' }}
          >
            <h3 className="text-white font-bold text-[12px] leading-tight truncate">{banner.title}</h3>
            <p className="text-white/70 text-[10px] mt-0.5">Sponsored</p>
          </div>
        </div>

        <div className="flex-1 hidden sm:flex flex-col min-w-0 overflow-hidden">
          <div style={{ height: 2, background: 'linear-gradient(90deg, #a78bfa, #ec4899)', flexShrink: 0 }} />

          <div className="px-4 py-3.5 flex flex-col gap-1.5 flex-1">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.12em] self-start px-2 py-0.5 rounded-full"
              style={{ background: '#f5f3ff', color: '#6d28d9' }}
            >
              Sponsored
            </span>

            <h3
              className="font-bold text-base leading-snug transition-colors group-hover:text-pink-500"
              style={{ color: '#1a1a2e' }}
            >
              {banner.title}
            </h3>

            <p className="text-[13px] leading-relaxed flex-1" style={{ color: '#64748b' }}>
              Tap to view this promotion.
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
