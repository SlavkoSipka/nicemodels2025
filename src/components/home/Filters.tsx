'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Filter, MapPin, Calendar, User } from 'lucide-react'

interface FiltersProps {
  selectedCity: string
  setSelectedCity: (city: string) => void
  selectedAge: string
  setSelectedAge: (age: string) => void
  selectedEthnicity: string
  setSelectedEthnicity: (ethnicity: string) => void
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
  const [cities, setCities] = useState<any[]>([])

  useEffect(() => {
    loadCities()
  }, [])

  const loadCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    if (!error && data) {
      setCities(data)
    }
  }

  return (
    <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-white font-bold">
            <Filter className="w-5 h-5" />
            <span>Filters:</span>
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-3 py-2">
            <MapPin className="w-4 h-4 text-white" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-white font-semibold text-sm outline-none cursor-pointer"
            >
              <option value="all" className="text-gray-900">All Cities</option>
              {cities.map((city) => (
                <option key={city.id} value={city.name} className="text-gray-900">
                  {city.name} {city.canton && `(${city.canton})`}
                </option>
              ))}
            </select>
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
