'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { trackBannerImpression, trackBannerClick } from '@/lib/tracking'
import type { BannerData } from './BannerCard'

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

const DISMISS_KEY = 'nm:mobileBannerPopup:dismissed'

interface MobileBannerPopupProps {
  banners: BannerData[]
}

/**
 * Mobile-only fixed bottom popup that auto-scrolls horizontally through
 * all purchased `sidebar_left` banners. Hidden at xl+ (desktop rail takes over).
 */
export default function MobileBannerPopup({ banners }: MobileBannerPopupProps) {
  const list = banners.filter(b => b.image_url)
  const [dismissed, setDismissed] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const impressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    if (dismissed) return
    if (!trackRef.current) return
    if (typeof IntersectionObserver === 'undefined') {
      list.forEach(b => {
        if (!impressed.current.has(b.id)) {
          impressed.current.add(b.id)
          trackBannerImpression(b.id)
        }
      })
      return
    }
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const id = (e.target as HTMLElement).dataset.bannerId
          if (id && !impressed.current.has(id)) {
            impressed.current.add(id)
            trackBannerImpression(id)
          }
        }
      },
      { threshold: 0.5 },
    )
    const nodes = trackRef.current.querySelectorAll<HTMLElement>('[data-banner-id]')
    nodes.forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [dismissed, list])

  if (list.length === 0 || dismissed) return null

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  const items = [...list, ...list]

  return (
    <div
      className="fixed bottom-2 left-2 right-2 z-40 xl:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03)',
        }}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-1.5 right-1.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm border border-black/5"
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        <div className="overflow-hidden pr-14 sm:pr-16">
          <div
            ref={trackRef}
            className="flex gap-2 py-2 pl-2 will-change-transform"
            style={{
              width: 'max-content',
              animation: reducedMotion
                ? undefined
                : `banner-marquee ${Math.max(20, list.length * 6)}s linear infinite`,
            }}
          >
            {items.map((banner, i) => {
              const href =
                banner.cta_url ||
                `/${banner.owner_type === 'club' ? 'clubs' : 'models'}/${banner.owner_id}`
              return (
                <Link
                  key={`${banner.id}-${i}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-banner-id={i < list.length ? banner.id : undefined}
                  onClick={() => trackBannerClick(banner.id, 'profile')}
                  className="block shrink-0"
                >
                  <div
                    className="relative overflow-hidden rounded-lg"
                    style={{
                      width: 80,
                      height: 120,
                      background: '#f1f5f9',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <Image
                      src={banner.image_url!}
                      alt={banner.title}
                      fill
                      sizes="80px"
                      quality={60}
                      placeholder="blur"
                      blurDataURL={BLUR}
                      className="object-cover"
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
