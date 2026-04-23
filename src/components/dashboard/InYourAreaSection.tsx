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
        const [m, c, l] = await Promise.all([
          supabase.rpc('entities_near_origin', { p_origin_city: originCity, p_radius_km: radius, p_entity: 'model' }),
          supabase.rpc('entities_near_origin', { p_origin_city: originCity, p_radius_km: radius, p_entity: 'club' }),
          supabase.rpc('entities_near_origin', { p_origin_city: originCity, p_radius_km: radius, p_entity: 'listing' }),
        ])
        if (cancelled) return
        setCounts({
          models: m.data?.length ?? 0,
          clubs: c.data?.length ?? 0,
          listings: l.data?.length ?? 0,
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [originCity, radius])

  if (!originCity) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-md bg-violet-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">In your area</p>
            <p className="text-xs text-gray-500">Set your city in profile to see nearby models, clubs and listings.</p>
          </div>
          <Link
            href="/dashboard/user/profile"
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900"
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
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-md bg-violet-100 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">In your area</p>
          <p className="text-xs text-gray-500">
            Around <span className="font-semibold text-gray-700">{originCity}</span>
            {loading && <span className="ml-2 text-gray-400">updating…</span>}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {RADII.map(r => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                radius === r
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700'
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ label, count, Icon, iconCls, hoverCls, href }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-1 p-3 border border-gray-200 rounded-lg transition-colors group ${hoverCls}`}
          >
            <Icon className={`w-5 h-5 ${iconCls}`} />
            <span className="text-xl font-bold text-gray-900">{count}</span>
            <span className="text-[11px] text-gray-500 font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
