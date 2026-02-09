'use client'

import { useState, useEffect } from 'react'

interface CitySelectorProps {
  selectedCity: string
  setSelectedCity: (city: string) => void
  totalModels: number
  models: Array<{
    model_details?: {
      city?: string
    }
  }>
}

interface CityWithCount {
  name: string
  count: number
}

export default function CitySelector({ selectedCity, setSelectedCity, totalModels, models }: CitySelectorProps) {
  const [cities, setCities] = useState<CityWithCount[]>([])

  useEffect(() => {
    // Count models per city from the provided models array
    const cityCounts: { [key: string]: number } = {}
    
    console.log('Models in CitySelector:', models)
    
    models.forEach(model => {
      const city = model.model_details?.city
      console.log('Model city:', city)
      if (city) {
        cityCounts[city] = (cityCounts[city] || 0) + 1
      }
    })

    console.log('City counts:', cityCounts)

    // Convert to array and sort by count
    const citiesArray = Object.entries(cityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    console.log('Cities array:', citiesArray)
    setCities(citiesArray)
  }, [models])

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {/* All Cities */}
          <button
            onClick={() => setSelectedCity('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedCity === 'all'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({totalModels})
          </button>

          {/* Individual Cities */}
          {cities.map((city) => (
            <button
              key={city.name}
              onClick={() => setSelectedCity(city.name)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedCity === city.name
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {city.name} ({city.count})
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
