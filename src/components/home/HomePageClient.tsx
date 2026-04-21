'use client'

import { useState, useMemo, useEffect } from 'react'
import { randomShuffle } from '@/lib/randomShuffle'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ModelCard from './ModelCard'
import BannerCard, { BannerData } from './BannerCard'
import BannerCardFeedCard from './BannerCardFeedCard'
import BannerSidebarRail from './BannerSidebarRail'
import { partitionBannersByPlacement } from '@/lib/bannerPlacement'
import CitySelector from './CitySelector'
import StoriesSection from '@/components/stories/StoriesSection'
import LatestStatusMessages from './LatestStatusMessages'
import AvailableForChat, { type ChatModel } from './AvailableForChat'

interface ModelService { id: number; name: string }

interface Model {
  id: string
  username: string
  created_at?: string
  photoUrl?: string | null
  public_id?: number | null
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
}

export default function HomePageClient({ initialModels, initialBanners = [], statusMessages = [], chatModels = [] }: HomePageClientProps) {
  const [selectedRegion,       setSelectedRegion]       = useState<string>('all')
  const [selectedCity,         setSelectedCity]         = useState<string>('all')
  const [selectedCategory,     setSelectedCategory]     = useState<string>('all')
  const [selectedOffer,        setSelectedOffer]        = useState<string>('all')
  const [selectedLiveLocation, setSelectedLiveLocation] = useState<string>('all')
  const [searchQuery,          setSearchQuery]          = useState<string>('')

  /** Per-placement pools; shuffled for fair rotation when multiple advertisers exist. */
  const [widePool, setWidePool] = useState<BannerData[]>([])
  const [cardPool, setCardPool] = useState<BannerData[]>([])
  const [sidebarPool, setSidebarPool] = useState<BannerData[]>([])

  useEffect(() => {
    const { feedWide, feedCard, sidebarLeft } = partitionBannersByPlacement(initialBanners)
    setWidePool(feedWide.length <= 1 ? feedWide : randomShuffle([...feedWide]))
    setCardPool(feedCard.length <= 1 ? feedCard : randomShuffle([...feedCard]))
    // Left rail: only one banner visible; which advertiser wins is random each load/refresh.
    const sideShuffled = sidebarLeft.length <= 1 ? sidebarLeft : randomShuffle([...sidebarLeft])
    setSidebarPool(sideShuffled.length ? [sideShuffled[0]] : [])
  }, [initialBanners])

  const filteredModels = useMemo(() => {
    let result = initialModels
    if (selectedRegion !== 'all') {
      result = result.filter(
        m => m.canton === selectedRegion || m.live_location_canton === selectedRegion,
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
  }, [initialModels, selectedRegion, selectedCity, selectedLiveLocation, selectedCategory, selectedOffer, searchQuery])

  const hasSidebar = statusMessages.length > 0 || chatModels.length > 0

  const renderModelFeed = () => {
    if (filteredModels.length === 0) {
      return (
        <div
          className="text-center py-20 rounded-xl"
          style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <p className="text-2xl font-bold mb-2" style={{ color: '#cbd5e1' }}>No models found</p>
          <p style={{ color: '#94a3b8' }}>Try changing filters</p>
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
    filteredModels.forEach((model, i) => {
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
    return (
      <div className="grid w-full grid-cols-2 gap-2 sm:gap-4">
        {items}
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{ background: '#fce9f3' }}>

        {/* Stories */}
        <StoriesSection />

        {/* Main: full-bleed row (lg); center column matches StoriesSection `max-w-[1280px] px-2 sm:px-4`; banner in left 1fr */}
        <div className="w-full pt-3 sm:pt-4 pb-4 sm:pb-6">
          {sidebarPool.length > 0 ? (
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1280px)_minmax(0,1fr)] lg:items-start lg:gap-x-4">
              <div className="hidden min-h-0 justify-end lg:flex lg:self-start">
                {/*
                  Sticky must not share overflow-* on the same node (breaks sticking to viewport).
                  Scroll lives on the inner wrapper.
                */}
                <aside className="sticky top-[120px] z-10 w-[220px] shrink-0 xl:w-[240px]">
                  <div className="max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden overscroll-contain">
                    <BannerSidebarRail banners={sidebarPool} />
                  </div>
                </aside>
              </div>
              <div className="flex min-w-0 flex-col gap-4 px-2 sm:px-4">
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
                {renderModelFeed()}
              </div>
              <div className="hidden min-h-0 lg:block" aria-hidden />
            </div>
          ) : (
            <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-2 sm:px-4">
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
              {renderModelFeed()}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {hasSidebar && (
          <div className="hidden xl:flex fixed right-0 top-[120px] flex-col gap-3 w-[275px] z-30 pr-3 max-h-[calc(100vh-140px)] overflow-y-auto">
            {chatModels.length > 0 && <AvailableForChat models={chatModels} />}
            {statusMessages.length > 0 && <LatestStatusMessages messages={statusMessages} />}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
