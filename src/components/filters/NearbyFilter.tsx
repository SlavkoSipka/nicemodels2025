'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, X, Radar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CANTON_NAMES: Record<string, string> = {
  AG: 'Aargau', AI: 'Appenzell I.', AR: 'Appenzell A.', BE: 'Bern',
  BL: 'Basel-Land', BS: 'Basel-Stadt', FR: 'Fribourg', GE: 'Geneva',
  FL: 'Liechtenstein', GL: 'Glarus', GR: 'Grisons', JU: 'Jura', LU: 'Lucerne',
  NE: 'Neuchâtel', NW: 'Nidwalden', OW: 'Obwalden', SG: 'St. Gallen',
  SH: 'Schaffhausen', SO: 'Solothurn', SZ: 'Schwyz', TG: 'Thurgau',
  TI: 'Ticino', UR: 'Uri', VD: 'Vaud', VS: 'Valais', ZG: 'Zug', ZH: 'Zürich',
}

interface CityResult {
  id: string
  name: string
  postal_code: string | null
  canton: string | null
}

export interface NearbyValue {
  originCity: string | null
  radiusKm: number | null
}

interface NearbyFilterProps {
  value: NearbyValue
  onChange: (v: NearbyValue) => void
  matchCount?: number | null
  className?: string
  compact?: boolean
}

const RADII = [20, 50, 100] as const

export default function NearbyFilter({ value, onChange, matchCount, className = '', compact }: NearbyFilterProps) {
  const [query, setQuery] = useState(value.originCity || '')
  const [results, setResults] = useState<CityResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    setQuery(value.originCity || '')
  }, [value.originCity])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const search = async (q: string) => {
    if (q.length < 1) { setResults([]); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const isNumeric = /^\d/.test(q)
      let query = supabase.from('cities').select('id, name, postal_code, canton').eq('is_active', true).limit(20)
      if (isNumeric) query = query.like('postal_code', `${q}%`).order('postal_code').order('name')
      else query = query.ilike('name', `${q}%`).order('name').order('postal_code')
      const { data } = await query
      setResults(data || [])
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (v: string) => {
    setQuery(v)
    setOpen(true)
    if (v === '') {
      onChange({ originCity: null, radiusKm: value.radiusKm })
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 200)
  }

  const pickCity = (c: CityResult) => {
    onChange({ originCity: c.name, radiusKm: value.radiusKm || 50 })
    setQuery(c.name)
    setOpen(false)
  }

  const clear = () => {
    onChange({ originCity: null, radiusKm: null })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const active = !!value.originCity && !!value.radiusKm

  return (
    <div ref={wrapRef} className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        <Radar className="w-3.5 h-3.5 text-violet-500" />
        {compact ? 'Nearby' : 'Nearby search'}
      </div>

      {/* Origin picker */}
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="City or postal code"
          className={`pl-8 pr-7 py-1.5 text-xs rounded-lg border outline-none w-[180px] sm:w-[200px] transition-colors ${
            active ? 'border-violet-400 bg-violet-50 text-violet-800 font-semibold' : 'border-slate-200 bg-white text-slate-700'
          }`}
        />
        {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />}
        {query && !loading && (
          <button type="button" onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {open && (results.length > 0 || loading || (query.length >= 1 && !loading)) && (
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-[240px] overflow-y-auto">
            {results.map(c => (
              <button
                key={c.id}
                type="button"
                className="block w-full text-left px-3 py-2 text-xs hover:bg-violet-50 hover:text-violet-700"
                onClick={() => pickCity(c)}
              >
                <span className="font-medium text-slate-700">{c.name}</span>
                {c.postal_code && <span className="text-slate-400 ml-1">({c.postal_code})</span>}
                {c.canton && <span className="text-slate-300 ml-1">· {CANTON_NAMES[c.canton] || c.canton}</span>}
              </button>
            ))}
            {!loading && results.length === 0 && query.length >= 1 && (
              <div className="px-3 py-2 text-xs text-slate-400">No cities match “{query}”</div>
            )}
          </div>
        )}
      </div>

      {/* Radius pills */}
      <div className="flex items-center gap-1">
        {RADII.map(r => {
          const selected = value.radiusKm === r
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ originCity: value.originCity, radiusKm: selected ? null : r })}
              disabled={!value.originCity && !selected}
              className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${
                selected
                  ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                  : value.originCity
                    ? 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700'
                    : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
              }`}
            >
              {r} km
            </button>
          )
        })}
      </div>

      {active && matchCount !== null && matchCount !== undefined && (
        <span className="text-[11px] text-slate-500 font-medium">
          {matchCount} in {value.radiusKm}km
        </span>
      )}
    </div>
  )
}
