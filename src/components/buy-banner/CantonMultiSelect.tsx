'use client'

import { useMemo } from 'react'
import { Check, Globe, RotateCcw, Star } from 'lucide-react'
import { CANTON_CODES, CANTON_NAMES, TOP_CANTONS, TOTAL_CANTONS } from '@/lib/cantons'

interface CantonMultiSelectProps {
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

/**
 * Grid multi-select for Swiss cantons. Used in buy-banner flows.
 * Includes quick-pick shortcuts: select all CH, top 5 cantons, reset.
 */
export default function CantonMultiSelect({ value, onChange, disabled }: CantonMultiSelectProps) {
  const selected = useMemo(() => new Set(value), [value])

  const toggle = (code: string) => {
    if (disabled) return
    const next = new Set(selected)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    onChange(Array.from(next))
  }

  const selectAll = () => {
    if (disabled) return
    onChange([...CANTON_CODES])
  }

  const selectTop = () => {
    if (disabled) return
    onChange([...TOP_CANTONS])
  }

  const reset = () => {
    if (disabled) return
    onChange([])
  }

  const sortedCantons = useMemo(
    () => [...CANTON_CODES].sort((a, b) => CANTON_NAMES[a].localeCompare(CANTON_NAMES[b])),
    [],
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={selectAll}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Globe className="w-3.5 h-3.5" />
          All of Switzerland
        </button>
        <button
          type="button"
          onClick={selectTop}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Star className="w-3.5 h-3.5" />
          Top regions (ZH, BE, VD, AG, SG)
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={disabled || value.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <span className="ml-auto text-xs font-bold text-gray-500">
          Selected: <span className="text-violet-700">{value.length}</span> / {TOTAL_CANTONS}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
        {sortedCantons.map(code => {
          const isOn = selected.has(code)
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              disabled={disabled}
              className={`relative flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isOn
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-violet-400 hover:bg-violet-50'
              }`}
            >
              <span className="truncate">{CANTON_NAMES[code]}</span>
              <span className="flex items-center gap-1 shrink-0">
                <span className={`text-[10px] font-mono ${isOn ? 'text-violet-100' : 'text-gray-400'}`}>
                  {code}
                </span>
                {isOn && <Check className="w-3 h-3" />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
