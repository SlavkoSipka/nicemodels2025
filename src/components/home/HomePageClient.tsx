'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ModelCard from './ModelCard'
import BannerCard, { BannerData } from './BannerCard'
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
  const [selectedRegion,   setSelectedRegion]   = useState<string>('all')
  const [selectedCity,     setSelectedCity]     = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedOffer,    setSelectedOffer]    = useState<string>('all')
  const [searchQuery,      setSearchQuery]      = useState<string>('')

  const filteredModels = useMemo(() => {
    let result = initialModels
    if (selectedRegion !== 'all')
      result = result.filter(m => m.canton === selectedRegion)
    if (selectedCity !== 'all')
      result = result.filter(m => m.model_details?.city === selectedCity)
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
  }, [initialModels, selectedRegion, selectedCity, selectedCategory, selectedOffer, searchQuery])

  const hasSidebar = statusMessages.length > 0 || chatModels.length > 0

  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{ background: '#fce9f3' }}>

        {/* Stories */}
        <StoriesSection />

        {/* Main content */}
        <div className="max-w-[1280px] mx-auto">
          <CitySelector
            selectedRegion={selectedRegion}   setSelectedRegion={setSelectedRegion}
            selectedCity={selectedCity}       setSelectedCity={setSelectedCity}
            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            selectedOffer={selectedOffer}     setSelectedOffer={setSelectedOffer}
            searchQuery={searchQuery}         setSearchQuery={setSearchQuery}
            totalModels={initialModels.length}
            models={initialModels}
          />
          <div className="px-4 py-6 w-full">
            {filteredModels.length === 0 ? (
              <div
                className="text-center py-20 rounded-xl"
                style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <p className="text-2xl font-bold mb-2" style={{ color: '#cbd5e1' }}>No models found</p>
                <p style={{ color: '#94a3b8' }}>Try changing filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {(() => {
                  const BANNER_GAP = 6
                  const items: React.ReactNode[] = []
                  let bannerIdx = 0

                  if (initialBanners.length > 0 && bannerIdx < initialBanners.length) {
                    items.push(
                      <BannerCard key={`banner-${initialBanners[bannerIdx].id}`} banner={initialBanners[bannerIdx]} />
                    )
                    bannerIdx++
                  }

                  filteredModels.forEach((model, i) => {
                    items.push(<ModelCard key={model.id} model={model} priority={i < 4} />)

                    if (
                      bannerIdx < initialBanners.length &&
                      (i + 1) % BANNER_GAP === 0
                    ) {
                      items.push(
                        <BannerCard key={`banner-${initialBanners[bannerIdx].id}`} banner={initialBanners[bannerIdx]} />
                      )
                      bannerIdx++
                    }
                  })

                  return items
                })()}
              </div>
            )}
          </div>
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
