'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { BannerData } from './BannerCard'

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

interface BannerSidebarRailProps {
  banners: BannerData[]
}

/** Sticky vertical promos for desktop left rail; tall portrait aspect. */
export default function BannerSidebarRail({ banners }: BannerSidebarRailProps) {
  const list = banners.filter(b => b.image_url)
  if (list.length === 0) return null

  return (
    <div className="flex flex-col gap-3 w-full max-w-[240px]">
      {list.map(banner => {
        const href = banner.cta_url || `/${banner.owner_type === 'club' ? 'clubs' : 'models'}/${banner.owner_id}`
        return (
          <Link key={banner.id} href={href} className="block group w-full shrink-0">
            <div
              className="relative overflow-hidden w-full rounded-xl transition-all duration-300"
              style={{
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                aspectRatio: '2/3',
                background: '#f1f5f9',
              }}
            >
              <Image
                src={banner.image_url!}
                alt={banner.title}
                fill
                sizes="240px"
                quality={65}
                placeholder="blur"
                blurDataURL={BLUR}
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
