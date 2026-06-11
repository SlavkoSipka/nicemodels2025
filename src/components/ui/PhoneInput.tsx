'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { COUNTRIES, DEFAULT_DIAL_CODE, findByDialCode, type Country } from '@/lib/countries'

interface PhoneInputProps {
  countryCode: string
  phoneNumber: string
  onCountryCodeChange: (dial: string) => void
  onPhoneNumberChange: (number: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  inputClassName?: string
  id?: string
  name?: string
}

export default function PhoneInput({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  id,
  name,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected: Country | undefined = useMemo(
    () => findByDialCode(countryCode || DEFAULT_DIAL_CODE),
    [countryCode]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(c => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.dialCode.replace('+', '').includes(q.replace('+', '')) ||
        c.code.toLowerCase().includes(q)
      )
    })
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => searchRef.current?.focus(), 0)
    }
  }, [open])

  const handleSelect = (c: Country) => {
    onCountryCodeChange(c.dialCode)
    setOpen(false)
  }

  const effectivePlaceholder = useMemo(() => {
    if (!placeholder) return undefined
    const withoutDialCode = placeholder.replace(/^\+\d{1,4}\s*/, '').trim()
    return withoutDialCode || placeholder
  }, [placeholder])

  const buttonLabel = selected
    ? `${selected.flag} ${selected.dialCode}`
    : countryCode || DEFAULT_DIAL_CODE

  return (
    <div ref={wrapperRef} className={`relative flex items-stretch w-full ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={`flex items-center gap-1 flex-shrink-0 px-2 sm:px-3 border-2 border-r-0 border-gray-200 rounded-l-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-pink-200 focus:border-pink-500 ${inputClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="whitespace-nowrap">{buttonLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      </button>

      <input
        id={id}
        name={name}
        type="tel"
        value={phoneNumber}
        onChange={e => onPhoneNumberChange(e.target.value)}
        placeholder={effectivePlaceholder}
        required={required}
        disabled={disabled}
        className={`w-full min-w-0 flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-r-lg focus:outline-none focus:ring-1 focus:ring-pink-200 focus:border-pink-500 transition-all bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${inputClassName}`}
        autoComplete="tel-national"
      />

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search country..."
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">No countries found</li>
            ) : (
              filtered.map(c => {
                const isSelected = selected?.code === c.code
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => handleSelect(c)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                        isSelected
                          ? 'bg-pink-50 text-pink-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-gray-500 font-mono text-xs">{c.dialCode}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
