'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Users, Building2, Briefcase, ArrowRight } from 'lucide-react'

interface InYourAreaProps {
  originCity: string | null
}

interface Counts {
  models: number
  clubs: number
  listings: number
}

const RADII = [20, 50, 100] as const

export default function InYourAreaSection({ originCity }: InYourAreaProps) {
  const [radius, setRadius] = useState<number>(50)
  const [counts, setCounts] = useState<Counts>({ models: 0, clubs: 0, listings: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!originCity) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('entities_near_origin_bundle', {
          p_origin_city: originCity,
          p_radius_km: radius,
        })
        if (cancelled) return

        let models = 0
        let clubs = 0
        let listings = 0

        if (!error && data && typeof data === 'object' && !Array.isArray(data)) {
          const j = data as Record<string, unknown>
          models = Number(j.models ?? 0)
          clubs = Number(j.clubs ?? 0)
          listings = Number(j.listings ?? 0)
        } else {
          const [m, c, l] = await Promise.all([
            supabase.rpc('entities_near_origin', { p_origin_city: originCity, p_radius_km: radius, p_entity: 'model' }),
            supabase.rpc('entities_near_origin', { p_origin_city: originCity, p_radius_km: radius, p_entity: 'club' }),
            supabase.rpc('entities_near_origin', { p_origin_city: originCity, p_radius_km: radius, p_entity: 'listing' }),
          ])
          if (cancelled) return
          models = m.data?.length ?? 0
          clubs = c.data?.length ?? 0
          listings = l.data?.length ?? 0
        }

        if (cancelled) return
        setCounts({ models, clubs, listings })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [originCity, radius])

  if (!originCity) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-md bg-violet-100 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-violet-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">In your area</p>
            <p className="text-[11px] md:text-xs text-gray-500">Set your city in profile to see nearby models, clubs and listings.</p>
          </div>
          <Link
            href="/dashboard/user/profile"
            className="shrink-0 inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-violet-700 hover:text-violet-900"
          >
            Set city <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    )
  }

  const items = [
    { label: 'Models', count: counts.models, Icon: Users, iconCls: 'text-pink-600', hoverCls: 'hover:border-pink-300 hover:bg-pink-50/40', href: `/?nearbyCity=${encodeURIComponent(originCity)}&nearbyRadius=${radius}` },
    { label: 'Clubs', count: counts.clubs, Icon: Building2, iconCls: 'text-indigo-600', hoverCls: 'hover:border-indigo-300 hover:bg-indigo-50/40', href: `/clubs?nearbyCity=${encodeURIComponent(originCity)}&nearbyRadius=${radius}` },
    { label: 'Listings', count: counts.listings, Icon: Briefcase, iconCls: 'text-amber-600', hoverCls: 'hover:border-amber-300 hover:bg-amber-50/40', href: `/jobs-rents?nearbyCity=${encodeURIComponent(originCity)}&nearbyRadius=${radius}` },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
      {/* Title row — stays on one line on mobile */}
      <div className="flex items-center gap-2.5 md:gap-3 mb-3">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-md bg-violet-100 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 md:w-5 md:h-5 text-violet-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">In your area</p>
          <p className="text-[11px] md:text-xs text-gray-500 truncate">
            Around <span className="font-semibold text-gray-700">{originCity}</span>
            {loading && <span className="ml-2 text-gray-400">updating…</span>}
          </p>
        </div>
      </div>
      {/* Radius pills — full row on mobile, no awkward wrap */}
      <div className="flex items-center gap-1.5 mb-3 md:mb-4">
        {RADII.map(r => (
          <button
            key={r}
            onClick={() => setRadius(r)}
            className={`flex-1 md:flex-initial px-2.5 py-1.5 md:py-1 text-[11px] font-semibold rounded-md border transition-colors ${
              radius === r
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700 active:bg-violet-50'
            }`}
          >
            {r} km
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {items.map(({ label, count, Icon, iconCls, hoverCls, href }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-0.5 md:gap-1 p-2.5 md:p-3 border border-gray-200 rounded-lg transition-colors group ${hoverCls} active:bg-gray-50`}
          >
            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${iconCls}`} />
            <span className="text-lg md:text-xl font-bold text-gray-900">{count}</span>
            <span className="text-[10px] md:text-[11px] text-gray-500 font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
