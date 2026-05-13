'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/layout/Navbar'
import { Building2, Search, ChevronDown, MapPin } from 'lucide-react'
import Footer from '@/components/layout/Footer'
import ViewCount from '@/components/ui/ViewCount'
import NearbyFilter, { type NearbyValue } from '@/components/filters/NearbyFilter'
import { useNearbyIds } from '@/lib/useNearbyIds'
import type { Club } from './types'

export default function ClubsPageClient({ initialClubs }: { initialClubs: Club[] }) {
  const t = useTranslations('clubs.list')
  const clubs = initialClubs
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [areaOpen, setAreaOpen] = useState(false)
  const [nearby, setNearby] = useState<NearbyValue>({ originCity: null, radiusKm: null })
  const { ids: nearbyClubIds } = useNearbyIds('club', nearby.originCity, nearby.radiusKm)

  const allAreas = useMemo(
    () => Array.from(new Set(clubs.map((c) => c.area).filter(Boolean))).sort(),
    [clubs]
  )

  const areaCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    clubs.forEach((c) => {
      if (c.area) counts[c.area] = (counts[c.area] || 0) + 1
    })
    return counts
  }, [clubs])

  const filtered = useMemo(() => {
    return clubs.filter((c) => {
      if (selectedArea !== 'all' && c.area !== selectedArea) return false
      if (nearbyClubIds && !nearbyClubIds.has(c.id)) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          c.display_name.toLowerCase().includes(q) ||
          c.club_name.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [clubs, selectedArea, search, nearbyClubIds])

  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{ background: '#fce9f3' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* Breadcrumb */}
          <div className="text-sm text-gray-400 mb-4 flex items-center gap-1">
            <Link href="/" className="hover:text-gray-700 transition-colors">{t('breadcrumbHome')}</Link>
            <span>›</span>
            <span className="text-gray-600 font-medium">{t('breadcrumbClubs')}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-gray-400" />
            {t('title')}
          </h1>
          <hr className="border-gray-200 mb-6" />

          {/* Area pills grid */}
          <div className="grid grid-cols-3 gap-x-8 gap-y-1 mb-6 text-sm">
            <button
              onClick={() => setSelectedArea('all')}
              className={`text-left py-0.5 ${selectedArea === 'all' ? 'text-slate-900 font-semibold' : 'text-gray-400 hover:text-gray-700'}`}
            >
              {t('allAreasCount', { count: clubs.length })}
            </button>
            {allAreas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`text-left py-0.5 ${selectedArea === area ? 'text-slate-900 font-semibold' : 'text-gray-400 hover:text-gray-700'}`}
              >
                {area}{' '}
                <span className="text-gray-400">({areaCounts[area] || 0})</span>
              </button>
            ))}
          </div>
          <hr className="border-gray-200 mb-6" />

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Area dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAreaOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:border-gray-400 transition-colors min-w-[140px]"
              >
                <MapPin className="w-4 h-4 text-brand" />
                <span>{selectedArea === 'all' ? t('allAreas') : selectedArea}</span>
                <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
              </button>
              {areaOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50 max-h-64 overflow-y-auto min-w-[180px]">
                  <button
                    onClick={() => { setSelectedArea('all'); setAreaOpen(false) }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t('allAreasCount', { count: clubs.length })}
                  </button>
                  {allAreas.map((area) => (
                    <button
                      key={area}
                      onClick={() => { setSelectedArea(area); setAreaOpen(false) }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {area} ({areaCounts[area] || 0})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchByName')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
              />
            </div>

            <NearbyFilter
              value={nearby}
              onChange={setNearby}
              matchCount={nearbyClubIds ? nearbyClubIds.size : null}
              compact
            />

            {/* Results count */}
            <div className="ml-auto flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900">{filtered.length.toLocaleString()}</span>
              <span className="text-sm text-slate-600 font-medium">
                {filtered.length === 1 ? t('club') : t('clubs')}
                {filtered.length !== clubs.length && (
                  <span className="text-slate-400"> {t('ofTotal', { total: clubs.length.toLocaleString() })}</span>
                )}
              </span>
            </div>
          </div>

          {/* Club cards - 2 per row, 16:9 image, description + tags */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-1">{t('noClubsFound')}</h3>
              <p className="text-gray-500 text-sm">{t('tryAdjustingFilters')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  {/* Image 16:9 with title overlay */}
                  <div className="relative w-full aspect-video bg-gray-100">
                    {club.photoUrl ? (
                      <Image
                        src={club.photoUrl}
                        alt={club.display_name || club.club_name}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 className="w-14 h-14 text-gray-300" />
                      </div>
                    )}
                    {/* Gradient + club name overlay bottom-left */}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"
                      aria-hidden
                    />
                    <h3 className="absolute bottom-0 left-0 right-0 p-4 text-white text-xl font-bold drop-shadow-lg">
                      {club.display_name || club.club_name}
                    </h3>
                    <span className="absolute top-3 right-3">
                      <ViewCount count={club.view_count ?? 0} />
                    </span>
                  </div>

                  {/* Description + tags */}
                  <div className="p-4 sm:p-5">
                    {club.description ? (
                      <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 mb-3">
                        {club.description.replace(/<[^>]*>/g, '')}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-3">
                        {club.is_club ? t('professionalDescClub') : t('professionalDescAgency')}
                      </p>
                    )}
                    {/* Tags: category + location in blue */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                        <Building2 className="w-4 h-4 shrink-0" />
                        {club.is_club ? t('tagClub') : t('tagAgency')}
                      </span>
                      {(club.area || club.city) && (
                        <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                          <MapPin className="w-4 h-4 shrink-0" />
                          {[club.city, club.area].filter(Boolean).join(' / ')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
