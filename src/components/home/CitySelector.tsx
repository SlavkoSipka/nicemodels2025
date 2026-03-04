'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface ModelDetail {
  city?: string
  ethnicity?: string
}

interface ModelService {
  id: number
  name: string
}

interface HomeModel {
  model_details?: ModelDetail | null
  model_services_list?: ModelService[]
}

interface CitySelectorProps {
  selectedCity: string
  setSelectedCity: (city: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  selectedOffer: string
  setSelectedOffer: (offer: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
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
  searchQuery,
  setSearchQuery,
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

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, width: '100%', padding: '10px 16px', borderRadius: 12,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: '#16181d', color: 'rgba(255,255,255,0.7)',
  }
  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(90deg, #9D174D, #EC4899)',
    border: '1px solid transparent', color: 'white',
  }
  const panelStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
    padding: '6px 0', borderRadius: 12, zIndex: 50,
    maxHeight: 280, overflowY: 'auto', overflowX: 'hidden',
    background: '#16181d', border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  }
  const optStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '9px 16px', fontSize: 13, cursor: 'pointer',
    color: 'rgba(255,255,255,0.65)', background: 'transparent',
    border: 'none', transition: 'all 0.12s',
  }

  const Opt = ({ label, onSel }: { label: string; onSel: () => void }) => (
    <button
      type="button"
      style={optStyle}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(236,72,153,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#F472B6' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)' }}
      onClick={onSel}
    >{label}</button>
  )

  return (
    <div style={{ backgroundColor: 'transparent' }}>
      <div className="max-w-7xl mx-auto px-4 py-4 w-full pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 w-full items-center">

          {/* Region */}
          <div className="relative min-w-0" ref={regionRef}>
            <button type="button" style={selectedCity !== 'all' ? btnActive : btnBase}
              onClick={() => setOpenDropdown(v => v === 'region' ? null : 'region')}>
              <span className="truncate">{selectedCity === 'all' ? 'Region' : selectedCity}</span>
              <ChevronDown style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.7 }} />
            </button>
            {openDropdown === 'region' && (
              <div style={panelStyle}>
                <Opt label={`All (${modelsForRegion.length})`} onSel={() => { setSelectedCity('all'); setOpenDropdown(null) }} />
                {cities.map(c => (
                  <Opt key={c.name} label={`${c.name} (${c.count})`} onSel={() => { setSelectedCity(c.name); setOpenDropdown(null) }} />
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="relative min-w-0" ref={categoryRef}>
            <button type="button" style={selectedCategory !== 'all' ? btnActive : btnBase}
              onClick={() => setOpenDropdown(v => v === 'category' ? null : 'category')}>
              <span className="truncate">{selectedCategory === 'all' ? 'Category' : selectedCategory}</span>
              <ChevronDown style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.7 }} />
            </button>
            {openDropdown === 'category' && (
              <div style={panelStyle}>
                <Opt label={`All (${modelsForCategory.length})`} onSel={() => { setSelectedCategory('all'); setOpenDropdown(null) }} />
                {categories.map(c => (
                  <Opt key={c.name} label={`${c.name} (${c.count})`} onSel={() => { setSelectedCategory(c.name); setOpenDropdown(null) }} />
                ))}
              </div>
            )}
          </div>

          {/* Offer */}
          <div className="relative min-w-0" ref={offerRef}>
            <button type="button" style={selectedOffer !== 'all' ? btnActive : btnBase}
              onClick={() => setOpenDropdown(v => v === 'offer' ? null : 'offer')}>
              <span className="truncate">{selectedOffer === 'all' ? 'Offer' : selectedOffer}</span>
              <ChevronDown style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.7 }} />
            </button>
            {openDropdown === 'offer' && (
              <div style={panelStyle}>
                <Opt label="All" onSel={() => { setSelectedOffer('all'); setOpenDropdown(null) }} />
                {offers.map(o => (
                  <Opt key={o.name} label={`${o.name} (${o.count})`} onSel={() => { setSelectedOffer(o.name); setOpenDropdown(null) }} />
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative min-w-0 sm:w-44">
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, pointerEvents: 'none', color: 'rgba(255,255,255,0.3)' }} />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name"
              aria-label="Search models by name"
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
                borderRadius: 12, fontSize: 13, outline: 'none',
                backgroundColor: '#16181d', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
              }}
              onFocus={e => { e.currentTarget.style.border = '1px solid rgba(236,72,153,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.12)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="flex justify-center pb-1">
        <div style={{ width: '80px', height: '1px', background: 'rgba(255,255,255,0.1)', borderRadius: 999 }} />
      </div>
    </div>
  )
}
