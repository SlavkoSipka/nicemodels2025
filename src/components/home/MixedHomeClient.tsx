'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ModelCard from './ModelCard'
import ClubCard, { type ClubCardData } from './ClubCard'
import BannerCard, { type BannerData } from './BannerCard'
import BannerCardFeedCard from './BannerCardFeedCard'
import BannerSidebarRail from './BannerSidebarRail'
import MobileBannerPopup from './MobileBannerPopup'
import ListingBannerCard, { type ListingBannerData } from './ListingBannerCard'
import { filterBannersByCanton, partitionBannersByPlacement } from '@/lib/bannerPlacement'
import { useVisitorCanton } from '@/lib/useVisitorCanton'
import StoriesSection from '@/components/stories/StoriesSection'
import LatestStatusMessages from './LatestStatusMessages'
import AvailableForChat, { type ChatModel } from './AvailableForChat'
import { type StatusMessage } from './HomePageClient'
import { ChevronLeft, ChevronRight, ChevronDown, Search, MapPin, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { seededShuffle } from '@/lib/randomShuffle'
import { cantonName, cantonGroup } from '@/lib/cantons'

interface Model {
  id: string
  username: string
  created_at?: string
  photoUrl?: string | null
  public_id?: number | null
  view_count?: number
  canton?: string | null
  /** Canton derived from live_location_city (+ postal) via `cities` table — for region filter */
  live_location_canton?: string | null
  model_details: {
    showname: string
    city: string
    age: number
    ethnicity: string
    hair_color: string
    about_me?: string
    services_for?: string[]
    live_location_city?: string | null
  } | null
  model_services_list?: { id: number; name: string }[]
}

interface CityResult {
  id: string
  name: string
  postal_code: string | null
  canton: string | null
}

type CardItem =
  | { type: 'model'; data: Model }
  | { type: 'club'; data: ClubCardData }
  | { type: 'banner'; data: BannerData }
  | { type: 'banner_card'; data: BannerData }
  | { type: 'listing'; data: ListingBannerData }

interface MixedHomeClientProps {
  models: Model[]
  clubs: ClubCardData[]
  banners: BannerData[]
  listings: ListingBannerData[]
  statusMessages: StatusMessage[]
  chatModels: ChatModel[]
  stories?: any[]
  /**
   * Per-request shuffle seed generated on the server. Reusing the same seed on
   * the client makes the SSR and hydrated card order identical (deterministic),
   * so the feed no longer reshuffles after hydration and moves cards out from
   * under the user's finger.
   */
  seed?: number
  /** Server-rendered H1 + intro strip, passed from the RSC page and inserted before the filter bar. */
  hero?: React.ReactNode
}

const WIDE_PER_PAGE = 3
const CARDS_PER_SLOT = 4

function buildInitialCards(
  models: Model[],
  clubs: ClubCardData[],
  banners: BannerData[],
  listings: ListingBannerData[],
) {
  const { feedWide, feedCard, sidebarLeft } = partitionBannersByPlacement(banners)
  return {
    cards: [
      ...models.map(m => ({ type: 'model' as const, data: m })),
      ...clubs.map(c => ({ type: 'club' as const, data: c })),
      ...feedCard.map(b => ({ type: 'banner_card' as const, data: b })),
    ] as CardItem[],
    wideSlots: [
      ...feedWide.map(b => ({ type: 'banner' as const, data: b })),
      ...listings.map(l => ({ type: 'listing' as const, data: l })),
    ] as CardItem[],
    sidebarRail: sidebarLeft.slice(0, 1),
    mobileSidebarRail: sidebarLeft,
  }
}

export default function MixedHomeClient({
  models, clubs, banners, listings, statusMessages, chatModels, stories, seed = 1, hero,
}: MixedHomeClientProps) {
  const t = useTranslations('home')
  // Filter state
  const [selectedRegion, setSelectedRegion] = useState('all')

  const visitorCanton = useVisitorCanton()
  const effectiveCanton = selectedRegion !== 'all' ? selectedRegion : visitorCanton

  // Banners targeting the current effective canton (visitor geo-IP, or active region filter).
  // "All-CH" banners (target_cantons NULL/empty) always pass through.
  const visibleBanners = useMemo(
    () => filterBannersByCanton(banners, effectiveCanton),
    [banners, effectiveCanton],
  )

  const initial = useMemo(
    () => buildInitialCards(models, clubs, visibleBanners, listings),
    [models, clubs, visibleBanners, listings],
  )

  const [cards, setCards] = useState<CardItem[]>(() => seededShuffle(initial.cards, seed))
  const [wideSlots, setWideSlots] = useState<CardItem[]>(() => seededShuffle(initial.wideSlots, seed))
  const [sidebarRail, setSidebarRail] = useState<BannerData[]>(
    () => (initial.sidebarRail.length <= 1 ? initial.sidebarRail : seededShuffle(initial.sidebarRail, seed).slice(0, 1)),
  )
  const [mobileSidebarRail, setMobileSidebarRail] = useState<BannerData[]>(
    () => (initial.mobileSidebarRail.length <= 1 ? initial.mobileSidebarRail : seededShuffle(initial.mobileSidebarRail, seed)),
  )
  const [page, setPage] = useState(0)
  const shouldScrollTop = useRef(false)
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedLiveLocation, setSelectedLiveLocation] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [regionOpen, setRegionOpen] = useState(false)

  // City search state
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState<CityResult[]>([])
  const [cityOpen, setCityOpen] = useState(false)
  const [cityLoading, setCityLoading] = useState(false)
  const cityRef = useRef<HTMLDivElement>(null)
  const regionDropdownRef = useRef<HTMLDivElement>(null)
  const cityDebounce = useRef<ReturnType<typeof setTimeout>>(null)

  // City search handlers
  const searchCities = useCallback(async (q: string) => {
    if (q.length < 1) { setCityResults([]); return }
    setCityLoading(true)
    try {
      const supabase = createClient()
      const isNumeric = /^\d/.test(q)
      let query = supabase.from('cities').select('id, name, postal_code, canton').eq('is_active', true).limit(25)
      if (isNumeric) {
        query = query.like('postal_code', `${q}%`).order('postal_code').order('name')
      } else {
        query = query.ilike('name', `${q}%`).order('name').order('postal_code')
      }
      const { data } = await query
      if (data) setCityResults(data)
    } catch { /* silent */ } finally { setCityLoading(false) }
  }, [])

  const handleCityInput = (val: string) => {
    if (selectedLiveLocation !== 'all') {
      const expected = `Live: ${selectedLiveLocation}`
      if (val !== expected) setSelectedLiveLocation('all')
    }
    setCityQuery(val)
    setCityOpen(true)
    if (val === '') {
      setSelectedCity('all')
      setSelectedLiveLocation('all')
      setCityResults([])
      return
    }
    if (cityDebounce.current) clearTimeout(cityDebounce.current)
    cityDebounce.current = setTimeout(() => searchCities(val), 200)
  }

  const handleCitySelect = (city: CityResult) => {
    setSelectedLiveLocation('all')
    setSelectedCity(city.name)
    const canton = cantonGroup(city.canton?.trim())
    setSelectedRegion(canton || 'all')
    setCityQuery(city.postal_code ? `${city.name} (${city.postal_code})` : city.name)
    setCityOpen(false)
    setPage(0)
  }

  const selectLiveFromDropdown = (city: string) => {
    setSelectedLiveLocation(city)
    setSelectedCity('all')
    const canton = cantonGroup(liveLocationToCanton[city]?.trim())
    setSelectedRegion(canton || 'all')
    setCityQuery(`Live: ${city}`)
    setCityOpen(false)
    setPage(0)
  }

  const clearCity = () => {
    setCityQuery('')
    setSelectedCity('all')
    setSelectedLiveLocation('all')
    setCityResults([])
    setCityOpen(false)
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false)
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target as Node)) setRegionOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Reset filters & pagination when logo is clicked while already on home
  useEffect(() => {
    function handleReset() {
      setSelectedRegion('all')
      setSelectedCity('all')
      setSelectedLiveLocation('all')
      setSearchQuery('')
      setCityQuery('')
      setCityResults([])
      setCityOpen(false)
      setRegionOpen(false)
      setPage(0)
    }
    window.addEventListener('nicemodels:reset-home', handleReset)
    return () => window.removeEventListener('nicemodels:reset-home', handleReset)
  }, [])

  // Region counts: each model counts once per canton where they appear (profile city and/or live)
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    models.forEach(m => {
      const codes = new Set<string>()
      if (m.canton) codes.add(cantonGroup(m.canton))
      if (m.live_location_canton) codes.add(cantonGroup(m.live_location_canton))
      codes.forEach((code) => {
        counts[code] = (counts[code] || 0) + 1
      })
    })
    clubs.forEach(c => {
      if (c.canton) {
        const g = cantonGroup(c.canton)
        counts[g] = (counts[g] || 0) + 1
      }
    })
    return counts
  }, [models, clubs])

  const sortedRegions = useMemo(() =>
    Object.entries(regionCounts).sort((a, b) => b[1] - a[1]),
    [regionCounts]
  )

  // Live location counts from models that have active live locations
  const liveLocationCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    models.forEach(m => {
      const loc = m.model_details?.live_location_city
      if (loc) counts[loc] = (counts[loc] || 0) + 1
    })
    return counts
  }, [models])

  /** Live cities alphabetically (always listed first in Location dropdown) */
  const sortedLiveLocations = useMemo(
    () => Object.entries(liveLocationCounts).sort((a, b) => a[0].localeCompare(b[0])),
    [liveLocationCounts],
  )

  const hasLiveLocations = sortedLiveLocations.length > 0

  const showCityPanel =
    cityOpen &&
    (hasLiveLocations ||
      cityResults.length > 0 ||
      cityLoading ||
      (cityQuery.length >= 1 && !cityLoading))

  /** Canton for each live_location_city string (from first model that has both). */
  const liveLocationToCanton = useMemo(() => {
    const map: Record<string, string> = {}
    for (const m of models) {
      const city = m.model_details?.live_location_city?.trim()
      const canton = m.live_location_canton?.trim()
      if (city && canton && map[city] === undefined) map[city] = canton
    }
    return map
  }, [models])

  // Filter models and clubs based on region, city, live location, and search
  const filteredModels = useMemo(() => {
    let result = models
    if (selectedRegion !== 'all') {
      result = result.filter(
        m => cantonGroup(m.canton) === selectedRegion || cantonGroup(m.live_location_canton) === selectedRegion,
      )
    }
    if (selectedCity !== 'all') {
      result = result.filter(
        m =>
          m.model_details?.city === selectedCity ||
          m.model_details?.live_location_city === selectedCity,
      )
    }
    if (selectedLiveLocation !== 'all') result = result.filter(m => m.model_details?.live_location_city === selectedLiveLocation)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(m => {
        const fields = [
          m.model_details?.showname, m.username, m.model_details?.city,
          m.model_details?.ethnicity, m.model_details?.about_me,
          ...(m.model_services_list?.map(s => s.name) ?? []),
        ]
        return fields.some(f => f && String(f).toLowerCase().includes(q))
      })
    }
    return result
  }, [models, selectedRegion, selectedCity, selectedLiveLocation, searchQuery])

  const filteredClubs = useMemo(() => {
    let result = clubs
    if (selectedRegion !== 'all') result = result.filter(c => cantonGroup(c.canton) === selectedRegion)
    if (selectedCity !== 'all') result = result.filter(c => c.city === selectedCity)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(c => {
        const fields = [c.display_name, c.area, c.city, c.description]
        return fields.some(f => f && f.toLowerCase().includes(q))
      })
    }
    return result
  }, [clubs, selectedRegion, selectedCity, searchQuery])

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings
    const q = searchQuery.trim().toLowerCase()
    return listings.filter(l => {
      const fields = [l.title, l.location, l.club_name, l.description]
      return fields.some(f => f && String(f).toLowerCase().includes(q))
    })
  }, [listings, searchQuery])

  const isFiltering = selectedRegion !== 'all' || selectedCity !== 'all' || selectedLiveLocation !== 'all' || searchQuery.trim() !== ''

  // Rebuild the feed when the canton-targeted banner set (or source data)
  // changes. The order is produced by a DETERMINISTIC seeded shuffle using the
  // server-provided `seed`, so the model cards keep their exact positions
  // across SSR -> hydration -> canton resolution. Only banner membership can
  // shift; the cards a user is about to tap never move under their finger.
  useEffect(() => {
    const fresh = buildInitialCards(models, clubs, visibleBanners, listings)
    setCards(seededShuffle(fresh.cards, seed))
    setWideSlots(seededShuffle(fresh.wideSlots, seed))
    setSidebarRail(
      fresh.sidebarRail.length <= 1 ? fresh.sidebarRail : seededShuffle(fresh.sidebarRail, seed).slice(0, 1),
    )
    setMobileSidebarRail(
      fresh.mobileSidebarRail.length <= 1 ? fresh.mobileSidebarRail : seededShuffle(fresh.mobileSidebarRail, seed),
    )
  }, [visibleBanners, models, clubs, listings, seed])

  const activeCards = useMemo(() => {
    const { feedCard } = partitionBannersByPlacement(visibleBanners)
    if (!isFiltering) return cards
    return seededShuffle([
      ...filteredModels.map(m => ({ type: 'model' as const, data: m })),
      ...filteredClubs.map(c => ({ type: 'club' as const, data: c })),
      ...feedCard.map(b => ({ type: 'banner_card' as const, data: b })),
    ], seed)
  }, [isFiltering, filteredModels, filteredClubs, cards, visibleBanners, seed])

  const activeWideSlots = useMemo(() => {
    const { feedWide } = partitionBannersByPlacement(visibleBanners)
    if (!isFiltering) return wideSlots
    return seededShuffle([
      ...feedWide.map(b => ({ type: 'banner' as const, data: b })),
      ...filteredListings.map(l => ({ type: 'listing' as const, data: l })),
    ], seed)
  }, [isFiltering, visibleBanners, filteredListings, wideSlots, seed])

  const hasSidebar = statusMessages.length > 0 || chatModels.length > 0

  // Page count must cover BOTH wide slots and mixed feed cards. Previously, when any wide
  // slot existed, only ceil(wides/3) was used — so with 3 listings/banners, totalPages
  // stayed 1 while activeCards could be 40+; only the first 12 cards were ever sliced,
  // so shuffled models could never appear on any page.
  const cardSlotsPerPage = WIDE_PER_PAGE * CARDS_PER_SLOT
  const pagesFromWide =
    activeWideSlots.length > 0 ? Math.ceil(activeWideSlots.length / WIDE_PER_PAGE) : 1
  const pagesFromCards = Math.max(1, Math.ceil(activeCards.length / cardSlotsPerPage))
  const totalPages = Math.max(pagesFromWide, pagesFromCards)

  const pageWide = activeWideSlots.slice(page * WIDE_PER_PAGE, (page + 1) * WIDE_PER_PAGE)
  const pageCards = activeCards.slice(
    page * cardSlotsPerPage,
    (page + 1) * cardSlotsPerPage,
  )

  useEffect(() => {
    if (shouldScrollTop.current) {
      shouldScrollTop.current = false
      window.scrollTo(0, 0)
    }
  }, [page])

  const goTo = (p: number) => {
    shouldScrollTop.current = true
    setPage(p)
  }

  const renderFilterBar = () => (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] gap-2 sm:gap-3 items-center pb-3 sm:pb-5">
        <div className="relative min-w-0" ref={regionDropdownRef}>
          <button
            type="button"
            className="appearance-none"
            onClick={() => setRegionOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 8, width: '100%', padding: '10px 16px', borderRadius: 10,
              fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              border: selectedRegion !== 'all' ? '1px solid #f9a8d4' : '1px solid #e2e8f0',
              backgroundColor: selectedRegion !== 'all' ? '#fef7fa' : '#ffffff',
              backgroundImage: 'none',
              color: selectedRegion !== 'all' ? '#be185d' : '#64748b',
              fontWeight: selectedRegion !== 'all' ? 600 : 500,
            }}
          >
            <span className="truncate">
              {selectedRegion === 'all' ? t('filters.region') : cantonName(selectedRegion)}
            </span>
            <ChevronDown style={{ width: 15, height: 15, flexShrink: 0, color: '#94a3b8' }} />
          </button>
          {regionOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              padding: '4px 0', borderRadius: 10, zIndex: 50,
              maxHeight: 280, overflowY: 'auto',
              background: '#ffffff', border: '1px solid #e2e8f0',
              boxShadow: '0 12px 36px rgba(0,0,0,0.10)',
            }}>
              {[['all', models.length + clubs.length] as [string, number], ...sortedRegions].map(([canton, count]) => (
                <button
                  key={canton}
                  type="button"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-[#fef7fa] hover:text-[#be185d] transition-colors"
                  onClick={() => { setSelectedRegion(canton); setRegionOpen(false); setPage(0) }}
                >
                  {canton === 'all' ? t('filters.allRegions') : cantonName(canton)}
                  <span className="ml-1 text-gray-400">({count})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative min-w-0" ref={cityRef}>
          <MapPin style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, pointerEvents: 'none', color: '#94a3b8', zIndex: 1 }} />
          <input
            type="text"
            value={cityQuery}
            onChange={e => handleCityInput(e.target.value)}
            onFocus={() => setCityOpen(true)}
            placeholder={t('filters.cityPlaceholder')}
            className="w-full appearance-none"
            style={{
              paddingLeft: 34, paddingRight: 32, paddingTop: 10, paddingBottom: 10,
              borderRadius: 10, fontSize: 13, fontWeight: (selectedCity !== 'all' || selectedLiveLocation !== 'all') ? 600 : 400,
              outline: 'none', transition: 'all 0.2s',
              backgroundColor: selectedLiveLocation !== 'all' ? '#ecfdf5' : selectedCity !== 'all' ? '#fef7fa' : '#ffffff',
              backgroundImage: 'none',
              border: selectedLiveLocation !== 'all' ? '1px solid #6ee7b7' : selectedCity !== 'all' ? '1px solid #f9a8d4' : '1px solid #e2e8f0',
              color: selectedLiveLocation !== 'all' ? '#047857' : selectedCity !== 'all' ? '#be185d' : '#64748b',
            }}
          />
          {cityLoading && (
            <Loader2 style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} className="animate-spin" />
          )}
          {cityQuery && !cityLoading && (
            <button type="button" onClick={clearCity}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X style={{ width: 14, height: 14, color: '#94a3b8' }} />
            </button>
          )}
          {showCityPanel && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              padding: '4px 0', borderRadius: 10, zIndex: 50,
              maxHeight: 320, overflowY: 'auto',
              background: '#ffffff', border: '1px solid #e2e8f0',
              boxShadow: '0 12px 36px rgba(0,0,0,0.10)',
            }}>
              {hasLiveLocations &&
                sortedLiveLocations.map(([city, count]) => (
                  <button
                    key={`live-${city}`}
                    type="button"
                    className="block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-emerald-50"
                    style={{ color: '#047857' }}
                    onClick={() => selectLiveFromDropdown(city)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>{t('filters.live', { city })}</span>
                      <span className="text-emerald-600/70 font-normal">({count})</span>
                    </span>
                  </button>
                ))}
              {cityQuery.length >= 1 && (cityResults.length > 0 || cityLoading) && (
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-t border-gray-100">
                  {t('filters.searchCities')}
                </div>
              )}
              {cityResults.map(city => (
                <button
                  key={city.id} type="button"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-[#fef7fa] hover:text-[#be185d] transition-colors"
                  onClick={() => handleCitySelect(city)}
                >
                  <span className="font-medium">{city.name}</span>
                  {city.postal_code && <span className="text-gray-400 ml-1">({city.postal_code})</span>}
                  {city.canton && <span className="text-gray-300 ml-1">· {cantonName(city.canton)}</span>}
                </button>
              ))}
              {cityQuery.length >= 1 && !cityLoading && cityResults.length === 0 && (
                <div className="px-4 py-3 text-center text-sm text-gray-400 border-t border-gray-100">
                  {t('filters.noCitiesMatch', { query: cityQuery })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative min-w-0">
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, pointerEvents: 'none', color: '#94a3b8' }} />
          <input
            type="search"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(0) }}
            placeholder={t('filters.searchAllCards')}
            className="w-full appearance-none"
            style={{
              paddingLeft: 34, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
              borderRadius: 10, fontSize: 13, fontWeight: 400, outline: 'none',
              backgroundColor: '#ffffff',
              backgroundImage: 'none',
              border: '1px solid #e2e8f0',
              color: '#1a1a2e',
            }}
            onFocus={e => { e.currentTarget.style.border = '1px solid #f9a8d4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.06)' }}
            onBlur={e => { e.currentTarget.style.border = '1px solid #e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>
      </div>
    </div>
  )

  const renderFeed = () => {
    if (activeCards.length === 0 && activeWideSlots.length === 0) {
      return (
        <div
          className="text-center py-20 rounded-xl"
          style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <p className="text-2xl font-bold mb-2" style={{ color: '#cbd5e1' }}>
            {isFiltering ? t('feed.noResults') : t('feed.noContent')}
          </p>
          <p style={{ color: '#94a3b8' }}>
            {isFiltering ? t('feed.tryChangingFilters') : t('feed.checkBackSoon')}
          </p>
        </div>
      )
    }
    return (
      <>
        <div className="grid w-full grid-cols-2 gap-2 sm:gap-4">
          {(() => {
            const nodes: React.ReactNode[] = []
            let cardIdx = 0

            for (let s = 0; s < Math.max(pageWide.length, Math.ceil(pageCards.length / CARDS_PER_SLOT)); s++) {
              if (s < pageWide.length) {
                const slot = pageWide[s]
                if (slot.type === 'banner') {
                  nodes.push(<BannerCard key={`b-${slot.data.id}`} banner={slot.data} />)
                } else if (slot.type === 'listing') {
                  nodes.push(<ListingBannerCard key={`l-${slot.data.id}`} listing={slot.data} />)
                }
              }

              const chunk = pageCards.slice(cardIdx, cardIdx + CARDS_PER_SLOT)
              cardIdx += CARDS_PER_SLOT
              chunk.forEach((item, i) => {
                const isTop = page === 0 && s === 0 && i < 4
                if (item.type === 'model') {
                  nodes.push(<ModelCard key={`m-${item.data.id}`} model={item.data} priority={isTop} />)
                } else if (item.type === 'club') {
                  nodes.push(<ClubCard key={`c-${item.data.id}`} club={item.data} priority={isTop} />)
                } else if (item.type === 'banner_card') {
                  nodes.push(<BannerCardFeedCard key={`bc-${item.data.id}`} banner={item.data} priority={isTop} />)
                }
              })
            }

            return nodes
          })()}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex w-full items-center justify-center gap-1 sm:mt-10 sm:gap-2">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 0}
              className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.10)', color: '#374151' }}
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">{t('feed.prev')}</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const show = i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1
                if (!show) {
                  const prevShown = i === 1 ? true : (i - 1 === 0 || i - 1 === totalPages - 1 || Math.abs(i - 1 - page) <= 1)
                  if (prevShown) return <span key={i} className="text-xs text-gray-400 px-0.5">…</span>
                  return null
                }
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-bold transition-all"
                    style={
                      i === page
                        ? { background: '#ec4899', color: '#ffffff', border: '1px solid #ec4899' }
                        : { background: '#ffffff', color: '#374151', border: '1px solid rgba(0,0,0,0.10)' }
                    }
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages - 1}
              className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.10)', color: '#374151' }}
            >
              <span className="hidden sm:inline">{t('feed.next')}</span> <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{ background: '#fce9f3' }}>
        <StoriesSection initialStories={stories} />

        <div className={`w-full pt-3 sm:pt-4 sm:pb-6 ${mobileSidebarRail.length > 0 ? 'pb-40' : 'pb-4'}`}>
          <div className="mx-auto w-full max-w-[1700px] px-2 sm:px-4 xl:grid xl:grid-cols-[240px_minmax(0,1fr)_280px] xl:gap-x-5 xl:items-start">
            <aside className="hidden xl:block xl:sticky xl:top-[120px] xl:self-start">
              {sidebarRail.length > 0 && (
                <div className="max-h-[calc(100vh-9rem)] overflow-y-auto overflow-x-hidden overscroll-contain pr-1">
                  <BannerSidebarRail banners={sidebarRail} />
                </div>
              )}
            </aside>

            <div className="mx-auto flex w-full min-w-0 max-w-[1100px] flex-col gap-4 xl:max-w-none xl:mx-0">
              {hero}
              {renderFilterBar()}
              <h2 className="sr-only">{t('feed.sectionHeading')}</h2>
              {renderFeed()}
            </div>

            <aside className="hidden xl:block xl:sticky xl:top-[120px] xl:self-start">
              {hasSidebar && (
                <div className="flex max-h-[calc(100vh-9rem)] flex-col gap-3 overflow-y-auto overscroll-contain pr-1">
                  {chatModels.length > 0 && <AvailableForChat models={chatModels} />}
                  {statusMessages.length > 0 && <LatestStatusMessages messages={statusMessages} />}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
      <MobileBannerPopup banners={mobileSidebarRail} />
      <Footer />
    </>
  )
}
