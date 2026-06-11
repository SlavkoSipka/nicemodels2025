'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { randomShuffle } from '@/lib/randomShuffle'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ModelCard from './ModelCard'
import BannerCard, { BannerData } from './BannerCard'
import BannerCardFeedCard from './BannerCardFeedCard'
import BannerSidebarRail from './BannerSidebarRail'
import MobileBannerPopup from './MobileBannerPopup'
import { filterBannersByCanton, partitionBannersByPlacement } from '@/lib/bannerPlacement'
import { cantonGroup } from '@/lib/cantons'
import { useVisitorCanton } from '@/lib/useVisitorCanton'
import CitySelector from './CitySelector'
import StoriesSection from '@/components/stories/StoriesSection'
import LatestStatusMessages from './LatestStatusMessages'
import AvailableForChat, { type ChatModel } from './AvailableForChat'
import NearbyFilter, { type NearbyValue } from '@/components/filters/NearbyFilter'
import { useNearbyIds } from '@/lib/useNearbyIds'

interface ModelService { id: number; name: string }

interface Model {
  id: string
  username: string
  created_at?: string
  photoUrl?: string | null
  public_id?: number | null
  view_count?: number
  canton?: string | null
  live_location_canton?: string | null
  model_details: {
    model_id?: string
    showname: string
    city: string
    age: number
    ethnicity: string
    hair_color: string
    about_me?: string
    services_for?: string[]
    slogan?: string | null
    nationality?: string | null
    gender?: string | null
    speaks_languages?: string[] | null
    live_location_city?: string | null
    live_location_postal_code?: string | null
  } | null
  model_services_list?: ModelService[]
}

export interface StatusMessage {
  id: string
  model_id: string
  caption: string
  created_at: string
  model_name: string
  model_photo: string | null
}

interface HomePageClientProps {
  initialModels: Model[]
  initialBanners?: BannerData[]
  statusMessages?: StatusMessage[]
  chatModels?: ChatModel[]
  stories?: any[]
}

export default function HomePageClient({ initialModels, initialBanners = [], statusMessages = [], chatModels = [], stories }: HomePageClientProps) {
  const t = useTranslations('home')
  const [selectedRegion,       setSelectedRegion]       = useState<string>('all')
  const [selectedCity,         setSelectedCity]         = useState<string>('all')
  const [selectedCategory,     setSelectedCategory]     = useState<string>('all')
  const [selectedOffer,        setSelectedOffer]        = useState<string>('all')
  const [selectedLiveLocation, setSelectedLiveLocation] = useState<string>('all')
  const [searchQuery,          setSearchQuery]          = useState<string>('')
  const [nearby,               setNearby]               = useState<NearbyValue>({ originCity: null, radiusKm: null })
  const { ids: nearbyModelIds } = useNearbyIds('model', nearby.originCity, nearby.radiusKm)

  // Incremental rendering: only mount a page worth of cards at a time so the
  // listing doesn't hydrate hundreds of ModelCards at once on mobile.
  const PAGE_SIZE = 24
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const visitorCanton = useVisitorCanton()
  const effectiveCanton = selectedRegion !== 'all' ? selectedRegion : visitorCanton

  // Banners targeting the visitor's canton (or active region filter).
  // "All-CH" banners (target_cantons NULL/empty) always pass through.
  const visibleBanners = useMemo(
    () => filterBannersByCanton(initialBanners, effectiveCanton),
    [initialBanners, effectiveCanton],
  )

  /** Per-placement pools; shuffled for fair rotation when multiple advertisers exist. */
  const [widePool, setWidePool] = useState<BannerData[]>([])
  const [cardPool, setCardPool] = useState<BannerData[]>([])
  const [sidebarPool, setSidebarPool] = useState<BannerData[]>([])
  const [mobileSidebarPool, setMobileSidebarPool] = useState<BannerData[]>([])

  useEffect(() => {
    const { feedWide, feedCard, sidebarLeft } = partitionBannersByPlacement(visibleBanners)
    setWidePool(feedWide.length <= 1 ? feedWide : randomShuffle([...feedWide]))
    setCardPool(feedCard.length <= 1 ? feedCard : randomShuffle([...feedCard]))
    // Left rail: only one banner visible; which advertiser wins is random each load/refresh.
    const sideShuffled = sidebarLeft.length <= 1 ? sidebarLeft : randomShuffle([...sidebarLeft])
    setSidebarPool(sideShuffled.length ? [sideShuffled[0]] : [])
    setMobileSidebarPool(sideShuffled)
  }, [visibleBanners])

  const filteredModels = useMemo(() => {
    let result = initialModels
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
    if (selectedLiveLocation !== 'all')
      result = result.filter(m => m.model_details?.live_location_city === selectedLiveLocation)
    if (selectedCategory !== 'all')
      result = result.filter(m => m.model_details?.ethnicity === selectedCategory)
    if (selectedOffer !== 'all')
      result = result.filter(m => m.model_services_list?.some(s => s.name === selectedOffer))
    if (nearbyModelIds) {
      result = result.filter(m => nearbyModelIds.has(m.id))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(m => {
        if (m.public_id && (`#${m.public_id}` === q || String(m.public_id) === q)) return true
        const fields = [
          m.model_details?.showname,
          m.username,
          m.model_details?.slogan,
          m.model_details?.ethnicity,
          m.model_details?.nationality,
          m.model_details?.city,
          m.model_details?.gender,
          ...(m.model_services_list?.map(s => s.name) ?? []),
          ...(m.model_details?.speaks_languages ?? []),
        ]
        return fields.some(f => f && String(f).toLowerCase().includes(q))
      })
    }
    return result
  }, [initialModels, selectedRegion, selectedCity, selectedLiveLocation, selectedCategory, selectedOffer, searchQuery, nearbyModelIds])

  // Reset the visible window whenever the filtered result set changes so a new
  // filter starts back at the first page of cards.
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [filteredModels])

  const hasSidebar = statusMessages.length > 0 || chatModels.length > 0

  const isFiltered =
    selectedRegion !== 'all' ||
    selectedCity !== 'all' ||
    selectedCategory !== 'all' ||
    selectedOffer !== 'all' ||
    selectedLiveLocation !== 'all' ||
    searchQuery.trim().length > 0 ||
    !!nearbyModelIds

  const renderCount = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <div className="flex items-baseline gap-2">
        <span className="text-lg sm:text-xl font-bold text-slate-900">
          {filteredModels.length.toLocaleString()}
        </span>
        <span className="text-xs sm:text-sm text-slate-600 font-medium">
          {filteredModels.length === 1 ? t('feed.model') : t('feed.models')}
          {isFiltered && initialModels.length !== filteredModels.length && (
            <span className="text-slate-400"> {t('feed.ofTotal', { total: initialModels.length.toLocaleString() })}</span>
          )}
        </span>
      </div>
      <NearbyFilter
        value={nearby}
        onChange={setNearby}
        matchCount={nearbyModelIds ? nearbyModelIds.size : null}
      />
    </div>
  )

  const renderModelFeed = () => {
    if (filteredModels.length === 0) {
      return (
        <div
          className="text-center py-20 rounded-xl"
          style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <p className="text-2xl font-bold mb-2" style={{ color: '#cbd5e1' }}>{t('feed.noModelsFound')}</p>
          <p style={{ color: '#94a3b8' }}>{t('feed.tryChangingFiltersShort')}</p>
        </div>
      )
    }
    const WIDE_GAP = 6
    const CARD_GAP = 4
    const items: React.ReactNode[] = []
    let wideIdx = 0
    let cardIdx = 0
    if (widePool.length > 0 && wideIdx < widePool.length) {
      items.push(<BannerCard key={`banner-wide-${widePool[wideIdx].id}-0`} banner={widePool[wideIdx]} priority />)
      wideIdx++
    }
    const visibleModels = filteredModels.slice(0, visibleCount)
    visibleModels.forEach((model, i) => {
      items.push(<ModelCard key={model.id} model={model} priority={i < 4} />)
      const n = i + 1
      if (n % WIDE_GAP === 0 && wideIdx < widePool.length) {
        items.push(<BannerCard key={`banner-wide-${widePool[wideIdx].id}-${n}`} banner={widePool[wideIdx]} />)
        wideIdx++
      }
      if (n % CARD_GAP === 0 && cardIdx < cardPool.length) {
        items.push(
          <BannerCardFeedCard key={`banner-card-${cardPool[cardIdx].id}-${n}`} banner={cardPool[cardIdx]} />
        )
        cardIdx++
      }
    })
    const hasMore = filteredModels.length > visibleCount
    return (
      <>
        <div className="grid w-full grid-cols-2 gap-2 sm:gap-4">
          {items}
        </div>
        {hasMore && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-white transition-colors"
              style={{ background: '#be185d' }}
            >
              {t('feed.loadMore')}
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

        {/* Stories */}
        <StoriesSection initialStories={stories} />

        {/* Main: 3-col grid at xl with sticky side rails; centered single-column below xl */}
        <div className={`w-full pt-3 sm:pt-4 sm:pb-6 ${mobileSidebarPool.length > 0 ? 'pb-40' : 'pb-4'}`}>
          <div className="mx-auto w-full max-w-[1700px] px-2 sm:px-4 xl:grid xl:grid-cols-[240px_minmax(0,1fr)_280px] xl:gap-x-5 xl:items-start">
            <aside className="hidden xl:block xl:sticky xl:top-[120px] xl:self-start">
              {sidebarPool.length > 0 && (
                <div className="max-h-[calc(100vh-9rem)] overflow-y-auto overflow-x-hidden overscroll-contain pr-1">
                  <BannerSidebarRail banners={sidebarPool} />
                </div>
              )}
            </aside>

            <div className="mx-auto flex w-full min-w-0 max-w-[1100px] flex-col gap-4 xl:max-w-none xl:mx-0">
              <CitySelector
                selectedRegion={selectedRegion}             setSelectedRegion={setSelectedRegion}
                selectedCity={selectedCity}                 setSelectedCity={setSelectedCity}
                selectedCategory={selectedCategory}         setSelectedCategory={setSelectedCategory}
                selectedOffer={selectedOffer}               setSelectedOffer={setSelectedOffer}
                selectedLiveLocation={selectedLiveLocation} setSelectedLiveLocation={setSelectedLiveLocation}
                searchQuery={searchQuery}                   setSearchQuery={setSearchQuery}
                totalModels={initialModels.length}
                models={initialModels}
              />
              {renderCount()}
              {renderModelFeed()}
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
      <MobileBannerPopup banners={mobileSidebarPool} />
      <Footer />
    </>
  )
}
