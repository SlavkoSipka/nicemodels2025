'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { ChevronDown } from 'lucide-react'

const OPTIONS = [
  { code: 'de', label: 'DE', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'fr', label: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'es', label: 'ES', flag: '🇪🇸', name: 'Español' },
  { code: 'hu', label: 'HU', flag: '🇭🇺', name: 'Magyar' },
  { code: 'ro', label: 'RO', flag: '🇷🇴', name: 'Română' },
  { code: 'it', label: 'IT', flag: '🇮🇹', name: 'Italiano' },
  { code: 'ru', label: 'RU', flag: '🇷🇺', name: 'Русский' },
  { code: 'pl', label: 'PL', flag: '🇵🇱', name: 'Polski' },
  { code: 'cs', label: 'CS', flag: '🇨🇿', name: 'Čeština' },
] as const

type Variant = 'navbar' | 'sidebar' | 'sidebar-collapsed' | 'mobile' | 'mobile-compact'

export default function LanguageSwitcher({ variant = 'navbar' }: { variant?: Variant }) {
  const locale = useLocale()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = OPTIONS.find(o => o.code === locale) ?? OPTIONS[0]

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const change = (code: string) => {
    setOpen(false)
    if (code === locale || pending) return
    startTransition(async () => {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: code }),
      })
      // Hard reload bypasses every client/CDN cache layer and forces the
      // server to render with the new NEXT_LOCALE cookie. router.refresh()
      // can return cached HTML from CDN with the previous locale.
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    })
  }

  if (variant === 'sidebar-collapsed') {
    return (
      <div className="flex flex-col items-center gap-1">
        {OPTIONS.map(opt => (
          <button
            key={opt.code}
            onClick={() => change(opt.code)}
            disabled={pending}
            className={`w-10 text-[10px] font-bold py-1 rounded ${
              locale === opt.code
                ? 'bg-pink-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={opt.name}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'mobile') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.code}
            onClick={() => change(opt.code)}
            disabled={pending}
            className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
              locale === opt.code
                ? 'bg-pink-600 text-white border-pink-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-pink-50 hover:border-pink-300'
            }`}
          >
            <span className="text-base leading-none">{opt.flag}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'mobile-compact') {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          disabled={pending}
          aria-label="Language"
          className="flex items-center gap-1 p-2 rounded-lg"
          style={{ color: '#94a3b8' }}
        >
          <span className="text-xl leading-none">{current.flag}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50 min-w-[170px]">
            {OPTIONS.map(opt => (
              <button
                key={opt.code}
                onClick={() => change(opt.code)}
                disabled={pending}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  locale === opt.code
                    ? 'bg-pink-50 text-pink-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-base leading-none">{opt.flag}</span>
                <span className="flex-1 text-left">{opt.name}</span>
                <span className="text-xs text-gray-400 font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'sidebar') {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          disabled={pending}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="text-base leading-none">{current.flag}</span>
            <span>{current.label}</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 bottom-full mb-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
            {OPTIONS.map(opt => (
              <button
                key={opt.code}
                onClick={() => change(opt.code)}
                disabled={pending}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                  locale === opt.code
                    ? 'bg-pink-50 text-pink-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-base leading-none">{opt.flag}</span>
                <span className="flex-1 text-left">{opt.name}</span>
                <span className="text-xs text-gray-400 font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative h-full">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={pending}
        className="h-full flex items-center justify-center gap-1.5 px-5 text-xs font-semibold cursor-pointer select-none border-l transition-colors"
        style={{ color: '#475569', borderColor: 'rgba(137,207,240,0.35)' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#1e293b'; e.currentTarget.style.backgroundColor = 'rgba(137,207,240,0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-0 bg-white rounded-b-lg border border-gray-200 shadow-lg overflow-hidden z-50 min-w-[160px]">
          {OPTIONS.map(opt => (
            <button
              key={opt.code}
              onClick={() => change(opt.code)}
              disabled={pending}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                locale === opt.code
                  ? 'bg-pink-50 text-pink-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-base leading-none">{opt.flag}</span>
              <span className="flex-1 text-left">{opt.name}</span>
              <span className="text-xs text-gray-400 font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
