'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

const OPTIONS = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
] as const

export default function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const change = (code: string) => {
    if (code === locale || pending) return
    startTransition(async () => {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: code }),
      })
      router.refresh()
    })
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        {OPTIONS.map(opt => (
          <button
            key={opt.code}
            onClick={() => change(opt.code)}
            disabled={pending}
            className={`w-10 text-[10px] font-bold py-1 rounded ${
              locale === opt.code
                ? 'bg-brand text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={opt.label}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
      {OPTIONS.map(opt => (
        <button
          key={opt.code}
          onClick={() => change(opt.code)}
          disabled={pending}
          className={`flex-1 text-xs font-semibold py-1 rounded transition-colors ${
            locale === opt.code
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
