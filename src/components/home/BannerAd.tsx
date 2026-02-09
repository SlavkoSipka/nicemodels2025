import Image from 'next/image'
import { ExternalLink } from 'lucide-react'

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
  const handleClick = () => {
    if (banner.contact_info?.website) {
      window.open(banner.contact_info.website, '_blank')
    } else if (banner.contact_info?.phoneNumber) {
      window.location.href = `tel:${banner.contact_info.phoneNumber}`
    } else if (banner.contact_info?.email) {
      window.location.href = `mailto:${banner.contact_info.email}`
    }
  }

  return (
    <div
      onClick={handleClick}
      className="relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-pink-200 hover:border-pink-500"
    >
      {/* Banner Image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={banner.bannerUrl}
          alt="Advertisement"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="text-white text-center px-4">
            <ExternalLink className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">Click to visit</p>
          </div>
        </div>
      </div>

      {/* Text Content */}
      {banner.advertising_text && (
        <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-600">
          <p className="text-white text-sm font-semibold line-clamp-2 text-center">
            {banner.advertising_text}
          </p>
        </div>
      )}

      {/* "AD" Badge */}
      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
        AD
      </div>
    </div>
  )
}
