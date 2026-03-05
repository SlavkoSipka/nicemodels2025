'use client'

import Image from 'next/image'
import Link from 'next/link'

export interface BannerData {
  id: string
  owner_type: 'model' | 'club'
  owner_id: string
  title: string
  image_url: string | null
  cta_url?: string | null
}

interface BannerCardProps {
  banner: BannerData
  priority?: boolean
}

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

export default function BannerCard({ banner, priority = false }: BannerCardProps) {
  if (!banner.image_url) return null

  const href = banner.cta_url || `/${banner.owner_type === 'club' ? 'clubs' : 'models'}/${banner.owner_id}`

  return (
    <Link href={href} className="block group w-full col-span-1 sm:col-span-2">
      <div
        className="relative overflow-hidden w-full transition-all duration-200"
        style={{
          borderRadius: '10px',
          border: '1px solid rgba(59,130,246,0.35)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.28)',
          aspectRatio: '4/1',
          background: '#16181d',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-3px)'
          el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.5)'
          el.style.borderColor = 'rgba(59,130,246,0.6)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.28)'
          el.style.borderColor = 'rgba(59,130,246,0.35)'
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
          className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
      </div>
    </Link>
  )
}
