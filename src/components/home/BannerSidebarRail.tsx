'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { trackBannerImpression, trackBannerClick } from '@/lib/tracking'
import type { BannerData } from './BannerCard'
import BannerImage from './BannerImage'

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

interface BannerSidebarRailProps {
  banners: BannerData[]
}

/**
 * Sticky vertical promos for a desktop side rail; tall portrait aspect.
 * Used for both `sidebar_left` and `sidebar_right` — the caller decides which
 * column it sits in, the rail itself only renders the pool it is handed.
 *
 * Impressions fire once per banner when it first scrolls at least half into
 * view, which is the same rule `BannerCard` uses, so rail and feed stats stay
 * comparable for advertisers.
 */
export default function BannerSidebarRail({ banners }: BannerSidebarRailProps) {
  const list = banners.filter(b => b.image_url)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const impressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    const root = trackRef.current
    if (!root || list.length === 0) return

    const fire = (id: string) => {
      if (impressed.current.has(id)) return
      impressed.current.add(id)
      trackBannerImpression(id)
    }

    if (typeof IntersectionObserver === 'undefined') {
      list.forEach(b => fire(b.id))
      return
    }

    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const id = (e.target as HTMLElement).dataset.bannerId
          if (id) fire(id)
        }
      },
      { threshold: 0.5 },
    )
    root.querySelectorAll<HTMLElement>('[data-banner-id]').forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [list])

  if (list.length === 0) return null

  return (
    <div ref={trackRef} className="flex flex-col gap-3 w-full max-w-[240px]">
      {list.map(banner => {
        const href = banner.cta_url || `/${banner.owner_type === 'club' ? 'clubs' : 'models'}/${banner.owner_id}`
        return (
          <Link
            key={banner.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            data-banner-id={banner.id}
            onClick={() => trackBannerClick(banner.id, 'profile')}
            className="block group w-full shrink-0"
          >
            <div
              className="relative overflow-hidden w-full rounded-xl transition-all duration-300"
              style={{
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                aspectRatio: '2/3',
                background: '#f1f5f9',
              }}
            >
              <BannerImage
                src={banner.image_url!}
                alt={banner.title}
                sizes="240px"
                quality={65}
                blurDataURL={BLUR}
                hoverScale
              />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
