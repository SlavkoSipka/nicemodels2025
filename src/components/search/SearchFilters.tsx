'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import CitySearch, { type CityResult } from '@/components/ui/CitySearch'

export default function SearchFilters() {
  const t = useTranslations('search.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    city: searchParams.get('city') || '',
    minAge: searchParams.get('minAge') || '',
    maxAge: searchParams.get('maxAge') || '',
    minPrice: '',
    maxPrice: '',
    services: [] as string[],
    verified: searchParams.get('verified') === 'true',
  })

  // Only city/minAge/maxAge/verified actually filter results (see
  // searchProfiles' SearchFilters doc for why category/services/price
  // aren't wired yet). Applying/resetting writes just those to the URL so
  // results are shareable/bookmarkable and ProfileGrid can react to them.
  const applyFilters = () => {
    const params = new URLSearchParams()
    if (filters.city) params.set('city', filters.city)
    if (filters.minAge) params.set('minAge', filters.minAge)
    if (filters.maxAge) params.set('maxAge', filters.maxAge)
    if (filters.verified) params.set('verified', 'true')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const resetFilters = () => {
    setFilters({
      category: '', city: '', minAge: '', maxAge: '',
      minPrice: '', maxPrice: '', services: [], verified: false,
    })
    router.push(pathname)
  }

  const categories = [
    { value: 'escort', label: t('categories.escort') },
    { value: 'trans', label: t('categories.trans') },
    { value: 'couples', label: t('categories.couples') },
    { value: 'vip', label: t('categories.vip') },
  ]
  const services = [
    { value: 'gfe', label: t('servicesList.gfe') },
    { value: 'massage', label: t('servicesList.massage') },
    { value: 'outcall', label: t('servicesList.outcall') },
    { value: 'overnight', label: t('servicesList.overnight') },
    { value: 'couples', label: t('servicesList.couples') },
    { value: 'party', label: t('servicesList.party') },
    { value: 'travelCompanion', label: t('servicesList.travelCompanion') },
    { value: 'dinnerDate', label: t('servicesList.dinnerDate') },
  ]

  const handleServiceToggle = (service: string) => {
    setFilters(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <Filter className="w-5 h-5 mr-2 text-pink-600" />
          {t('title')}
        </h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isOpen && (
        <div className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('category')}
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <CitySearch
              value={filters.city}
              onChange={(city) => setFilters({ ...filters, city: city?.name || '' })}
              label={t('location')}
              placeholder={t('locationPlaceholder')}
            />
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('ageRange')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder={t('min')}
                value={filters.minAge}
                onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder={t('max')}
                value={filters.maxAge}
                onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('pricePerHour')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder={t('min')}
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder={t('max')}
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('services')}
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {services.map(service => (
                <label key={service.value} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={filters.services.includes(service.value)}
                    onChange={() => handleServiceToggle(service.value)}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{service.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Verified Only */}
          <div>
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <span className="ml-2 text-sm font-semibold text-gray-700">
                {t('verifiedOnly')}
              </span>
            </label>
          </div>

          {/* Apply Buttons */}
          <div className="space-y-2 pt-4 border-t">
            <button
              type="button"
              onClick={applyFilters}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition"
            >
              {t('applyFilters')}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              {t('resetAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

