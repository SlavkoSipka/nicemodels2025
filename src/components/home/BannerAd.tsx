'use client'

import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { trackBannerImpression, trackBannerClick } from '@/lib/tracking'

interface BannerAdProps {
  banner: {
    id: string
    bannerUrl: string
    advertising_text: string
    contact_info: {
      phoneNumber?: string
      email?: string
      website?: string
    }
  }
}

export default function BannerAd({ banner }: BannerAdProps) {
  const ref = useRef<HTMLDivElement | null>(null)
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

  const handleClick = () => {
    if (banner.contact_info?.website) {
      trackBannerClick(banner.id, 'website')
      window.open(banner.contact_info.website, '_blank')
    } else if (banner.contact_info?.phoneNumber) {
      trackBannerClick(banner.id, 'phone')
      window.location.href = `tel:${banner.contact_info.phoneNumber}`
    } else if (banner.contact_info?.email) {
      trackBannerClick(banner.id, 'email')
      window.location.href = `mailto:${banner.contact_info.email}`
    }
  }

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-pink-200 hover:border-pink-500"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={banner.bannerUrl}
          alt="Advertisement"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="text-white text-center px-4">
            <ExternalLink className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">Click to visit</p>
          </div>
        </div>
      </div>

      {banner.advertising_text && (
        <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600">
          <p className="text-white text-sm font-semibold line-clamp-2 text-center">
            {banner.advertising_text}
          </p>
        </div>
      )}

      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
        AD
      </div>
    </div>
  )
}
