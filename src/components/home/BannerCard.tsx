'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { trackBannerImpression, trackBannerClick } from '@/lib/tracking'
import type { BannerPlacement } from '@/lib/bannerPlacement'

export interface BannerData {
  id: string
  owner_type: 'model' | 'club'
  owner_id: string
  title: string
  image_url: string | null
  cta_url?: string | null
  /** Defaults to feed_wide when omitted (legacy rows). */
  placement?: BannerPlacement
}

interface BannerCardProps {
  banner: BannerData
  priority?: boolean
}

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

export default function BannerCard({ banner, priority = false }: BannerCardProps) {
  const ref = useRef<HTMLAnchorElement | null>(null)
  const fired = useRef(false)

  useEffect(() => {
    if (!ref.current || fired.current) return
    if (typeof IntersectionObserver === 'undefined') {
      fired.current = true
      trackBannerImpression(banner.id)
      return
    }
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting && !fired.current) {
            fired.current = true
            trackBannerImpression(banner.id)
            io.disconnect()
          }
        }
      },
      { threshold: 0.5 }
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [banner.id])

  if (!banner.image_url) return null

  const href = banner.cta_url || `/${banner.owner_type === 'club' ? 'clubs' : 'models'}/${banner.owner_id}`

  return (
    <Link
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackBannerClick(banner.id, 'profile')}
      className="block group w-full col-span-2"
    >
      <div
        className="relative overflow-hidden w-full transition-all duration-300"
        style={{
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.02)',
          aspectRatio: '4/1',
          background: '#f1f5f9',
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
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          priority={priority}
          quality={85}
          placeholder="blur"
          blurDataURL={BLUR}
          className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
    </Link>
  )
}
