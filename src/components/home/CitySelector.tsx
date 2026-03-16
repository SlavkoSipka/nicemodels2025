'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ChevronDown, Search, MapPin, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CANTON_NAMES: Record<string, string> = {
  AG: 'Aargau', AI: 'Appenzell I.', AR: 'Appenzell A.', BE: 'Bern',
  BL: 'Basel-Land', BS: 'Basel-Stadt', FR: 'Fribourg', GE: 'Geneva',
  GL: 'Glarus', GR: 'Grisons', JU: 'Jura', LU: 'Lucerne',
  NE: 'Neuchâtel', NW: 'Nidwalden', OW: 'Obwalden', SG: 'St. Gallen',
  SH: 'Schaffhausen', SO: 'Solothurn', SZ: 'Schwyz', TG: 'Thurgau',
  TI: 'Ticino', UR: 'Uri', VD: 'Vaud', VS: 'Valais', ZG: 'Zug', ZH: 'Zürich',
}

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
  canton?: string | null
}

interface CityResult {
  id: string
  name: string
  postal_code: string | null
  canton: string | null
}

interface CitySelectorProps {
  selectedRegion: string
  setSelectedRegion: (r: string) => void
  selectedCity: string
  setSelectedCity: (c: string) => void
  selectedCategory: string
  setSelectedCategory: (c: string) => void
  selectedOffer: string
  setSelectedOffer: (o: string) => void
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

export default function CitySelector({
  selectedRegion,
  setSelectedRegion,
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

  // City search state
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState<CityResult[]>([])
  const [cityOpen, setCityOpen] = useState(false)
  const [cityLoading, setCityLoading] = useState(false)
  const cityRef = useRef<HTMLDivElement>(null)
  const cityDebounce = useRef<ReturnType<typeof setTimeout>>(null)

  // Region (canton) counts from model data
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    models.forEach(m => {
      const canton = m.canton
      if (canton) counts[canton] = (counts[canton] || 0) + 1
    })
    return counts
  }, [models])

  const sortedRegions = useMemo(() => {
    return Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
  }, [regionCounts])

  // Filter models for dynamic category/offer counts
  const modelsForCategory = useMemo(() => {
    return models.filter(m => {
      if (selectedRegion !== 'all' && m.canton !== selectedRegion) return false
      if (selectedCity !== 'all' && m.model_details?.city !== selectedCity) return false
      if (selectedOffer !== 'all' && !m.model_services_list?.some(s => s.name === selectedOffer)) return false
      return true
    })
  }, [models, selectedRegion, selectedCity, selectedOffer])

  const modelsForOffer = useMemo(() => {
    return models.filter(m => {
      if (selectedRegion !== 'all' && m.canton !== selectedRegion) return false
      if (selectedCity !== 'all' && m.model_details?.city !== selectedCity) return false
      if (selectedCategory !== 'all' && m.model_details?.ethnicity !== selectedCategory) return false
      return true
    })
  }, [models, selectedRegion, selectedCity, selectedCategory])

  const categories = useUniqueOptions(modelsForCategory, m => m.model_details?.ethnicity)
  const offers = useUniqueOptions(modelsForOffer, m => m.model_services_list?.map(s => s.name))

  // Reset invalid selections
  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.some(c => c.name === selectedCategory)) setSelectedCategory('all')
  }, [selectedCategory, categories, setSelectedCategory])
  useEffect(() => {
    if (selectedOffer !== 'all' && !offers.some(o => o.name === selectedOffer)) setSelectedOffer('all')
  }, [selectedOffer, offers, setSelectedOffer])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node
      if (
        regionRef.current?.contains(t) ||
        categoryRef.current?.contains(t) ||
        offerRef.current?.contains(t) ||
        cityRef.current?.contains(t)
      ) return
      setOpenDropdown(null)
      setCityOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // City search
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
    setCityQuery(val)
    setCityOpen(true)
    if (val === '') { setSelectedCity('all'); setCityResults([]); return }
    if (cityDebounce.current) clearTimeout(cityDebounce.current)
    cityDebounce.current = setTimeout(() => searchCities(val), 200)
  }

  const handleCitySelect = (city: CityResult) => {
    setSelectedCity(city.name)
    setCityQuery(city.postal_code ? `${city.name} (${city.postal_code})` : city.name)
    setCityOpen(false)
  }

  const clearCity = () => {
    setCityQuery('')
    setSelectedCity('all')
    setCityResults([])
    setCityOpen(false)
  }

  const cantonName = (code: string) => CANTON_NAMES[code] || code

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, width: '100%', padding: '10px 16px', borderRadius: 10,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
    border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#64748b',
  }
  const btnActive: React.CSSProperties = {
    ...btnBase, background: '#fef7fa', border: '1px solid #f9a8d4', color: '#be185d', fontWeight: 600,
  }
  const panelStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
    padding: '4px 0', borderRadius: 10, zIndex: 50,
    maxHeight: 280, overflowY: 'auto', overflowX: 'hidden',
    background: '#ffffff', border: '1px solid #e2e8f0',
    boxShadow: '0 12px 36px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.04)',
  }
  const optStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '9px 16px', fontSize: 13, cursor: 'pointer',
    color: '#64748b', background: 'transparent', border: 'none', transition: 'all 0.12s',
  }

  const Opt = ({ label, onSel }: { label: string; onSel: () => void }) => (
    <button
      type="button"
      style={optStyle}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef7fa'; (e.currentTarget as HTMLButtonElement).style.color = '#be185d' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
      onClick={onSel}
    >{label}</button>
  )

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 pt-4 w-full">

        {/* Filter bar: Region | City | Category | Offer | Search */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 w-full items-center pb-5">

          {/* Region dropdown */}
          <div className="relative min-w-0" ref={regionRef}>
            <button type="button" style={selectedRegion !== 'all' ? btnActive : btnBase}
              onClick={() => setOpenDropdown(v => v === 'region' ? null : 'region')}>
              <span className="truncate">{selectedRegion === 'all' ? 'Region' : cantonName(selectedRegion)}</span>
              <ChevronDown style={{ width: 15, height: 15, flexShrink: 0, color: '#94a3b8' }} />
            </button>
            {openDropdown === 'region' && (
              <div style={panelStyle}>
                <Opt label={`All regions (${totalModels})`} onSel={() => { setSelectedRegion('all'); setOpenDropdown(null) }} />
                {sortedRegions.map(([canton, count]) => (
                  <Opt key={canton} label={`${cantonName(canton)} (${count})`} onSel={() => { setSelectedRegion(canton); setOpenDropdown(null) }} />
                ))}
              </div>
            )}
          </div>

          {/* City search (postal code based) */}
          <div className="relative min-w-0" ref={cityRef}>
            <div className="relative">
              <MapPin style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, pointerEvents: 'none', color: '#94a3b8' }} />
              <input
                type="text"
                value={cityQuery}
                onChange={e => handleCityInput(e.target.value)}
                onFocus={() => { if (cityQuery && cityResults.length > 0) setCityOpen(true) }}
                placeholder="City or postal code"
                style={{
                  ...btnBase,
                  paddingLeft: 34, paddingRight: 32,
                  ...(selectedCity !== 'all' ? { background: '#fef7fa', border: '1px solid #f9a8d4', color: '#be185d', fontWeight: 600 } : {}),
                }}
              />
              {cityLoading && (
                <Loader2 style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} className="animate-spin" />
              )}
              {cityQuery && !cityLoading && (
                <button
                  type="button"
                  onClick={clearCity}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X style={{ width: 14, height: 14, color: '#94a3b8' }} />
                </button>
              )}
            </div>
            {cityOpen && cityResults.length > 0 && (
              <div style={panelStyle}>
                {cityResults.map(city => (
                  <button
                    key={city.id}
                    type="button"
                    style={optStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef7fa'; (e.currentTarget as HTMLButtonElement).style.color = '#be185d' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
                    onClick={() => handleCitySelect(city)}
                  >
                    <span className="font-medium">{city.name}</span>
                    {city.postal_code && <span className="text-gray-400 ml-1">({city.postal_code})</span>}
                    {city.canton && <span className="text-gray-300 ml-1">· {cantonName(city.canton)}</span>}
                  </button>
                ))}
              </div>
            )}
            {cityOpen && cityQuery.length >= 1 && cityResults.length === 0 && !cityLoading && (
              <div style={{ ...panelStyle, padding: '12px 16px', textAlign: 'center' }}>
                <p className="text-sm text-gray-400">No cities found</p>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="relative min-w-0" ref={categoryRef}>
            <button type="button" style={selectedCategory !== 'all' ? btnActive : btnBase}
              onClick={() => setOpenDropdown(v => v === 'category' ? null : 'category')}>
              <span className="truncate">{selectedCategory === 'all' ? 'Category' : selectedCategory}</span>
              <ChevronDown style={{ width: 15, height: 15, flexShrink: 0, color: '#94a3b8' }} />
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
              <ChevronDown style={{ width: 15, height: 15, flexShrink: 0, color: '#94a3b8' }} />
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
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, pointerEvents: 'none', color: '#94a3b8' }} />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search models by name"
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
                borderRadius: 10, fontSize: 13, fontWeight: 400, outline: 'none',
                backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#1a1a2e',
              }}
              onFocus={e => { e.currentTarget.style.border = '1px solid #f9a8d4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.06)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid #e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
