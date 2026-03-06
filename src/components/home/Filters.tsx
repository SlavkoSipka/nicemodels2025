'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Filter, MapPin, Calendar, User, Search, X } from 'lucide-react'

interface FiltersProps {
  selectedCity: string
  setSelectedCity: (city: string) => void
  selectedAge: string
  setSelectedAge: (age: string) => void
  selectedEthnicity: string
  setSelectedEthnicity: (ethnicity: string) => void
}

interface CityOption {
  id: string
  name: string
  postal_code: string | null
  canton: string | null
}

export default function Filters({
  selectedCity,
  setSelectedCity,
  selectedAge,
  setSelectedAge,
  selectedEthnicity,
  setSelectedEthnicity
}: FiltersProps) {
  const supabase = createClient()
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState<CityOption[]>([])
  const [isCityOpen, setIsCityOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const cityRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (selectedCity === 'all') {
      setCityQuery('')
    }
  }, [selectedCity])

  const searchCities = useCallback(async (q: string) => {
    if (q.length < 1) { setCityResults([]); return }
    setLoading(true)
    const isNumeric = /^\d/.test(q)
    let query = supabase
      .from('cities')
      .select('id, name, postal_code, canton')
      .eq('is_active', true)
      .limit(20)

    if (isNumeric) {
      query = query.like('postal_code', `${q}%`).order('postal_code').order('name')
    } else {
      query = query.ilike('name', `${q}%`).order('name').order('postal_code')
    }

    const { data } = await query
    if (data) setCityResults(data)
    setLoading(false)
  }, [supabase])

  const handleCityInput = (val: string) => {
    setCityQuery(val)
    setIsCityOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val === '') {
      setSelectedCity('all')
      setCityResults([])
      return
    }
    debounceRef.current = setTimeout(() => searchCities(val), 200)
  }

  const handleCitySelect = (city: CityOption) => {
    setSelectedCity(city.name)
    setCityQuery(city.postal_code ? `${city.name} (${city.postal_code})` : city.name)
    setIsCityOpen(false)
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setIsCityOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-white font-bold">
            <Filter className="w-5 h-5" />
            <span>Filters:</span>
          </div>

          {/* City Filter with autocomplete */}
          <div ref={cityRef} className="relative">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-3 py-1">
              <MapPin className="w-4 h-4 text-white" />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => handleCityInput(e.target.value)}
                onFocus={() => { if (cityQuery) setIsCityOpen(true) }}
                placeholder={selectedCity === 'all' ? 'All Cities' : selectedCity}
                className="bg-transparent text-white font-semibold text-sm outline-none placeholder-white/70 w-36"
              />
              {selectedCity !== 'all' && (
                <button onClick={() => { setSelectedCity('all'); setCityQuery(''); setCityResults([]) }}
                  className="text-white/70 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {isCityOpen && cityResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 w-64 bg-white rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                {cityResults.map(c => (
                  <button key={c.id} type="button"
                    onClick={() => handleCitySelect(c)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-900 transition-colors">
                    <span className="font-medium">{c.name}</span>
                    {c.postal_code && <span className="text-gray-400 ml-1">({c.postal_code}{c.canton ? `, ${c.canton}` : ''})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Age Filter */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-white" />
            <select
              value={selectedAge}
              onChange={(e) => setSelectedAge(e.target.value)}
              className="bg-transparent text-white font-semibold text-sm outline-none cursor-pointer"
            >
              <option value="all" className="text-gray-900">All Ages</option>
              <option value="18-25" className="text-gray-900">18-25</option>
              <option value="26-30" className="text-gray-900">26-30</option>
              <option value="31-35" className="text-gray-900">31-35</option>
              <option value="36-40" className="text-gray-900">36-40</option>
              <option value="41-99" className="text-gray-900">41+</option>
            </select>
          </div>

          {/* Ethnicity Filter */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-3 py-2">
            <User className="w-4 h-4 text-white" />
            <select
              value={selectedEthnicity}
              onChange={(e) => setSelectedEthnicity(e.target.value)}
              className="bg-transparent text-white font-semibold text-sm outline-none cursor-pointer"
            >
              <option value="all" className="text-gray-900">All Ethnicities</option>
              <option value="european" className="text-gray-900">European</option>
              <option value="asian" className="text-gray-900">Asian</option>
              <option value="latina" className="text-gray-900">Latina</option>
              <option value="african" className="text-gray-900">African</option>
              <option value="middle_eastern" className="text-gray-900">Middle Eastern</option>
              <option value="mixed" className="text-gray-900">Mixed</option>
            </select>
          </div>

          {/* Reset Button */}
          {(selectedCity !== 'all' || selectedAge !== 'all' || selectedEthnicity !== 'all') && (
            <button
              onClick={() => {
                setSelectedCity('all')
                setSelectedAge('all')
                setSelectedEthnicity('all')
                setCityQuery('')
                setCityResults([])
              }}
              className="ml-auto px-4 py-2 bg-white text-pink-600 font-semibold rounded-lg hover:bg-gray-100 transition-all text-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
