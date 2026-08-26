'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, CheckCircle } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { searchProfiles, getPrimaryPhoto, getModelRatingsBatch, type Profile, type SearchFilters } from '@/lib/api/profiles'
import { createClient } from '@/lib/supabase/client'

const PAGE_SIZE = 24

export default function ProfileGrid() {
  const t = useTranslations('search.grid')
  const searchParams = useSearchParams()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const supabase = createClient()

  // category/services aren't passed here: they have no unambiguous DB mapping
  // yet (see searchProfiles' SearchFilters doc), so wiring them would silently
  // filter on the wrong thing rather than genuinely not filter at all.
  const filters: SearchFilters = {
    city: searchParams.get('city') || undefined,
    minAge: searchParams.get('minAge') ? Number(searchParams.get('minAge')) : undefined,
    maxAge: searchParams.get('maxAge') ? Number(searchParams.get('maxAge')) : undefined,
    verified: searchParams.get('verified') === 'true' || undefined,
  }
  const filtersKey = JSON.stringify(filters)

  const loadPage = useCallback(async (pageNum: number) => {
    const result = await searchProfiles(filters, pageNum, PAGE_SIZE, supabase)
    // One batched ratings query for the whole page instead of N round-trips.
    const ratings = await getModelRatingsBatch(result.profiles.map(p => p.id), supabase)
    const withRatings = result.profiles.map(p => {
      const r = ratings.get(p.id)
      return { ...p, rating: r?.rating ?? 0, reviewCount: r?.count ?? 0 }
    })
    return { profiles: withRatings as Profile[], total: result.total }
    // filtersKey mirrors filters' content so this only changes when a real
    // filter value changes, not on every render (filters is a fresh object).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, filtersKey])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { profiles: list, total: count } = await loadPage(1)
      if (!active) return
      setProfiles(list)
      setTotal(count)
      setPage(1)
      setLoading(false)
    })()
    return () => { active = false }
  }, [loadPage])

  const handleLoadMore = async () => {
    const next = page + 1
    setLoadingMore(true)
    const { profiles: list } = await loadPage(next)
    setProfiles(prev => [...prev, ...list])
    setPage(next)
    setLoadingMore(false)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <p className="mt-4 text-gray-600">{t('loading')}</p>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">{t('noProfiles')}</p>
        <p className="mt-2 text-gray-500">{t('tryAdjusting')}</p>
      </div>
    )
  }

  const hasMore = profiles.length < total

  return (
    <div>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {t('showing', { visible: profiles.length, total })}
        </p>
      </div>

      {/* Grid — 2 columns on mobile for tappable targets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {profiles.map((profile, i) => (
          <Link
            key={profile.id}
            href={`/models/${profile.id}`}
            prefetch={i < 8}
            className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
          >
            {/* Image */}
            <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-200">
              <Image
                src={getPrimaryPhoto(profile.photos)}
                alt={profile.full_name || 'Model'}
                fill
                sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 18vw"
                priority={i < 4}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Badges */}
              <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between">
                {profile.is_verified && (
                  <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-[10px] flex items-center">
                    <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                    {t('verified')}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-2">
              <h3 className="font-semibold text-gray-800 text-[13px] truncate">
                {profile.full_name || t('model')}
              </h3>
              <p className="text-[11px] text-gray-600 mt-0.5 truncate flex items-center">
                <MapPin className="w-3 h-3 mr-0.5 shrink-0" />
                {profile.model_details?.location_city || t('unknown')}
              </p>
              {!!(profile as any).rating && (
                <div className="flex items-center text-[11px] text-gray-600 mt-0.5">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-0.5" />
                  <span className="font-semibold">{(profile as any).rating}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-pink-600 text-white rounded-full text-sm font-bold hover:bg-pink-700 transition disabled:opacity-60"
          >
            {loadingMore ? t('loading') : t('next')}
          </button>
        </div>
      )}
    </div>
  )
}
