'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface ModelDetail {
  city?: string
  ethnicity?: string
}

interface ModelService {
  id: number
  name: string
}

interface HomeModel {
  model_details?: ModelDetail
  model_services_list?: ModelService[]
}

interface CitySelectorProps {
  selectedCity: string
  setSelectedCity: (city: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  selectedOffer: string
  setSelectedOffer: (offer: string) => void
  totalModels: number
  models: HomeModel[]
}

interface OptionWithCount {
  name: string
  count: number
}

function useUniqueOptions(
  models: HomeModel[],
  getValue: (m: HomeModel) => string | string[] | undefined
): OptionWithCount[] {
  const counts: Record<string, number> = {}
  models.forEach((model) => {
    const val = getValue(model)
    if (val == null) return
    const arr = Array.isArray(val) ? val : [val]
    arr.forEach((v) => {
      const s = String(v).trim()
      if (s) counts[s] = (counts[s] || 0) + 1
    })
  })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function filterByCategoryAndOffer(
  models: HomeModel[],
  category: string,
  offer: string
) {
  return models.filter((m) => {
    if (category !== 'all' && m.model_details?.ethnicity !== category) return false
    if (offer !== 'all' && !m.model_services_list?.some((s) => s.name === offer)) return false
    return true
  })
}

function filterByRegionAndOffer(
  models: HomeModel[],
  region: string,
  offer: string
) {
  return models.filter((m) => {
    if (region !== 'all' && m.model_details?.city !== region) return false
    if (offer !== 'all' && !m.model_services_list?.some((s) => s.name === offer)) return false
    return true
  })
}

function filterByRegionAndCategory(
  models: HomeModel[],
  region: string,
  category: string
) {
  return models.filter((m) => {
    if (region !== 'all' && m.model_details?.city !== region) return false
    if (category !== 'all' && m.model_details?.ethnicity !== category) return false
    return true
  })
}

export default function CitySelector({
  selectedCity,
  setSelectedCity,
  selectedCategory,
  setSelectedCategory,
  selectedOffer,
  setSelectedOffer,
  totalModels,
  models,
}: CitySelectorProps) {
  const [openDropdown, setOpenDropdown] = useState<'region' | 'category' | 'offer' | null>(null)
  const regionRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const offerRef = useRef<HTMLDivElement>(null)

  // Opcije za Region: samo oni gradovi koji postoje za trenutni Category + Offer
  const modelsForRegion = filterByCategoryAndOffer(models, selectedCategory, selectedOffer)
  const cities = useUniqueOptions(modelsForRegion, (m) => m.model_details?.city)

  // Opcije za Category: samo one kategorije koje postoje za trenutni Region + Offer
  const modelsForCategory = filterByRegionAndOffer(models, selectedCity, selectedOffer)
  const categories = useUniqueOptions(modelsForCategory, (m) => m.model_details?.ethnicity)

  // Opcije za Offer: samo one usluge koje postoje za trenutni Region + Category
  const modelsForOffer = filterByRegionAndCategory(models, selectedCity, selectedCategory)
  const offers = useUniqueOptions(modelsForOffer, (m) => m.model_services_list?.map((s) => s.name))

  // Ako je izabrana vrednost više nije u listi (npr. promenio region), vrati na "all"
  useEffect(() => {
    if (selectedCity !== 'all' && !cities.some((c) => c.name === selectedCity)) setSelectedCity('all')
  }, [selectedCity, cities, setSelectedCity])
  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.some((c) => c.name === selectedCategory)) setSelectedCategory('all')
  }, [selectedCategory, categories, setSelectedCategory])
  useEffect(() => {
    if (selectedOffer !== 'all' && !offers.some((o) => o.name === selectedOffer)) setSelectedOffer('all')
  }, [selectedOffer, offers, setSelectedOffer])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node
      if (
        regionRef.current?.contains(t) ||
        categoryRef.current?.contains(t) ||
        offerRef.current?.contains(t)
      ) return
      setOpenDropdown(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const triggerBase =
    'flex items-center justify-between gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all border cursor-pointer'
  const triggerDefault =
    'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'
  const triggerActive = 'bg-brand text-white border-brand shadow-md'
  const panelClass =
    'absolute top-full left-0 right-0 mt-2 py-2 rounded-lg bg-white border border-gray-200 shadow-xl z-50 max-h-72 overflow-y-auto overflow-x-hidden'
  const optionClass =
    'block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg mx-1 cursor-pointer transition-colors truncate min-w-0'

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          {/* Region */}
          <div className="relative min-w-0" ref={regionRef}>
            <button
              type="button"
              onClick={() => setOpenDropdown((v) => (v === 'region' ? null : 'region'))}
              className={`${triggerBase} ${selectedCity !== 'all' ? triggerActive : triggerDefault}`}
            >
              <span className="truncate">{selectedCity === 'all' ? 'Region' : selectedCity}</span>
              <ChevronDown className="w-4 h-4 shrink-0 opacity-80" />
            </button>
            {openDropdown === 'region' && (
              <div className={panelClass}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity('all')
                    setOpenDropdown(null)
                  }}
                  className={optionClass}
                >
                  All ({modelsForRegion.length})
                </button>
                {cities.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelectedCity(c.name)
                      setOpenDropdown(null)
                    }}
                    className={optionClass}
                  >
                    {c.name} ({c.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="relative min-w-0" ref={categoryRef}>
            <button
              type="button"
              onClick={() => setOpenDropdown((v) => (v === 'category' ? null : 'category'))}
              className={`${triggerBase} ${selectedCategory !== 'all' ? triggerActive : triggerDefault}`}
            >
              <span className="truncate">{selectedCategory === 'all' ? 'Category' : selectedCategory}</span>
              <ChevronDown className="w-4 h-4 shrink-0 opacity-80" />
            </button>
            {openDropdown === 'category' && (
              <div className={panelClass}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all')
                    setOpenDropdown(null)
                  }}
                  className={optionClass}
                >
                  All ({modelsForCategory.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c.name)
                      setOpenDropdown(null)
                    }}
                    className={optionClass}
                  >
                    {c.name} ({c.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Offer */}
          <div className="relative min-w-0" ref={offerRef}>
            <button
              type="button"
              onClick={() => setOpenDropdown((v) => (v === 'offer' ? null : 'offer'))}
              className={`${triggerBase} ${selectedOffer !== 'all' ? triggerActive : triggerDefault}`}
            >
              <span className="truncate">{selectedOffer === 'all' ? 'Offer' : selectedOffer}</span>
              <ChevronDown className="w-4 h-4 shrink-0 opacity-80" />
            </button>
            {openDropdown === 'offer' && (
              <div className={panelClass}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOffer('all')
                    setOpenDropdown(null)
                  }}
                  className={optionClass}
                >
                  All
                </button>
                {offers.map((o) => (
                  <button
                    key={o.name}
                    type="button"
                    onClick={() => {
                      setSelectedOffer(o.name)
                      setOpenDropdown(null)
                    }}
                    className={optionClass}
                  >
                    {o.name} ({o.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
