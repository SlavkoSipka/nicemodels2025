'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ModelCard from './ModelCard'
import BannerCard, { BannerData } from './BannerCard'
import CitySelector from './CitySelector'
import StoriesSection from '@/components/stories/StoriesSection'
import LatestStatusMessages from './LatestStatusMessages'

interface ModelService { id: number; name: string }

interface Model {
  id: string
  username: string
  created_at?: string
  photoUrl?: string | null
  model_details: {
    model_id?: string
    showname: string
    city: string
    age: number
    ethnicity: string
    hair_color: string
    about_me?: string
    services_for?: string[]
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
}

export default function HomePageClient({ initialModels, initialBanners = [], statusMessages = [] }: HomePageClientProps) {
  const [selectedCity,     setSelectedCity]     = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedOffer,    setSelectedOffer]    = useState<string>('all')
  const [searchQuery,      setSearchQuery]      = useState<string>('')

  const filteredModels = useMemo(() => {
    let result = initialModels
    if (selectedCity !== 'all')
      result = result.filter(m => m.model_details?.city === selectedCity)
    if (selectedCategory !== 'all')
      result = result.filter(m => m.model_details?.ethnicity === selectedCategory)
    if (selectedOffer !== 'all')
      result = result.filter(m => m.model_services_list?.some(s => s.name === selectedOffer))
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(m => {
        const name = m.model_details?.showname ?? m.username ?? ''
        return name.toLowerCase().includes(q)
      })
    }
    return result
  }, [initialModels, selectedCity, selectedCategory, selectedOffer, searchQuery])

  const hasSidebar = statusMessages.length > 0

  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 370px, #1f2126 370px)' }}>
        <div className={`max-w-[1480px] mx-auto ${hasSidebar ? 'xl:flex xl:gap-5' : ''}`}>
          {/* Left: all main content */}
          <div className="flex-1 min-w-0 max-w-7xl">
            <StoriesSection />
            <CitySelector
              selectedCity={selectedCity}       setSelectedCity={setSelectedCity}
              selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
              selectedOffer={selectedOffer}     setSelectedOffer={setSelectedOffer}
              searchQuery={searchQuery}         setSearchQuery={setSearchQuery}
              totalModels={initialModels.length}
              models={initialModels}
            />
            <div className="px-4 py-6 w-full">
              {filteredModels.length === 0 ? (
                <div className="text-center py-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-2xl font-bold mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>No models found</p>
                  <p style={{ color: 'rgba(255,255,255,0.2)' }}>Try changing filters</p>
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

          {/* Right: sticky sidebar - desktop only */}
          {hasSidebar && (
            <div className="hidden xl:block w-[280px] shrink-0 pr-4 pt-4">
              <LatestStatusMessages messages={statusMessages} />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
