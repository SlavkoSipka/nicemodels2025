'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Search, X, Loader2 } from 'lucide-react'

export interface CityResult {
  id: string
  name: string
  postal_code: string | null
  canton: string | null
}

interface CitySearchProps {
  value: string
  postalCode?: string
  onChange: (city: CityResult | null) => void
  placeholder?: string
  required?: boolean
  label?: string
  className?: string
  inputClassName?: string
  showPostalCode?: boolean
}

export default function CitySearch({
  value,
  postalCode,
  onChange,
  placeholder,
  required = false,
  label,
  className = '',
  inputClassName = '',
  showPostalCode = true,
}: CitySearchProps) {
  const t = useTranslations('components.citySearch')
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState<CityResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    const display = value
      ? (postalCode ? `${value} (${postalCode})` : value)
      : ''
    setQuery(display)
  }, [value, postalCode])

  const searchCities = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const isNumeric = /^\d/.test(searchQuery)

      let q = supabase
        .from('cities')
        .select('id, name, postal_code, canton')
        .eq('is_active', true)
        .limit(25)

      if (isNumeric) {
        q = q.like('postal_code', `${searchQuery}%`)
          .order('postal_code')
          .order('name')
      } else {
        q = q.ilike('name', `${searchQuery}%`)
          .order('name')
          .order('postal_code')
      }

      const { data, error } = await q

      if (!error && data) {
        setResults(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setHighlightIndex(-1)
    setIsOpen(true)

    if (val === '') {
      onChange(null)
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchCities(val), 200)
  }

  const handleSelect = (city: CityResult) => {
    const display = city.postal_code
      ? `${city.name} (${city.postal_code})`
      : city.name
    setQuery(display)
    onChange(city)
    setIsOpen(false)
    setHighlightIndex(-1)
  }

  const handleClear = () => {
    setQuery('')
    onChange(null)
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && highlightIndex < results.length) {
        handleSelect(results[highlightIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatResult = (city: CityResult) => {
    if (showPostalCode && city.postal_code) {
      return (
        <span>
          <span className="font-medium">{city.name}</span>
          <span className="text-gray-400 ml-1">
            ({city.postal_code}{city.canton ? `, ${city.canton}` : ''})
          </span>
        </span>
      )
    }
    return (
      <span>
        <span className="font-medium">{city.name}</span>
        {city.canton && <span className="text-gray-400 ml-1">({city.canton})</span>}
      </span>
    )
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-1">
          {label} {required && <span className="text-pink-600">*</span>}
        </label>
      )}

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (query && results.length > 0) setIsOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t('defaultPlaceholder')}
          required={required}
          className={`w-full pl-9 pr-16 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-gray-50 ${inputClassName}`}
          autoComplete="off"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Search className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((city, idx) => (
            <button
              key={`${city.id}`}
              type="button"
              onClick={() => handleSelect(city)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                idx === highlightIndex
                  ? 'bg-pink-50 text-pink-900'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              {formatResult(city)}
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 1 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500 text-center">{t('noResults')}</p>
        </div>
      )}
    </div>
  )
}
