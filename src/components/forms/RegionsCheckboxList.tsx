'use client'

import { Globe, Check } from 'lucide-react'
import { ALL_REGION_IDS, REGIONS, type RegionId } from '@/lib/regions'

interface Props {
  selected: RegionId[]
  onChange: (next: RegionId[]) => void
  /** Optional override of the master "All regions" checkbox label. */
  allLabel?: string
  /** Compact mode for tight forms. */
  compact?: boolean
}

/**
 * Multi-region picker with a master "All regions" toggle.
 *
 * - When "All regions" is checked, individual region checkboxes are inactive and
 *   `selected` is stored as the full list.
 * - Selecting any individual region clears the "All" state automatically.
 * - Unchecking the last region falls back to "All".
 */
export default function RegionsCheckboxList({ selected, onChange, allLabel = 'All regions', compact }: Props) {
  const allChecked = selected.length === 0 || selected.length === ALL_REGION_IDS.length

  const toggleAll = () => {
    if (allChecked) {
      // Switch from "All" to nothing — but keep at least Zürich for usability.
      onChange([REGIONS[0].id])
    } else {
      onChange([...ALL_REGION_IDS])
    }
  }

  const toggleOne = (id: RegionId) => {
    let next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]
    // If user selected every region individually, normalize to "All" by storing all ids
    if (next.length === 0) next = [...ALL_REGION_IDS]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggleAll}
        className={`w-full flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
          allChecked
            ? 'bg-brand text-white border-brand'
            : 'bg-white text-gray-800 border-gray-200 hover:border-brand/50'
        }`}
      >
        <Box checked={allChecked} brandWhenChecked />
        <Globe className={`w-4 h-4 ${allChecked ? 'text-white' : 'text-brand'}`} />
        <span>{allLabel}</span>
        <span className={`ml-auto text-[11px] font-bold uppercase ${allChecked ? 'text-white/80' : 'text-gray-400'}`}>
          {ALL_REGION_IDS.length} regions
        </span>
      </button>

      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {REGIONS.map(region => {
          const checked = !allChecked && selected.includes(region.id)
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => toggleOne(region.id)}
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                checked
                  ? 'bg-brand/5 border-brand/40'
                  : 'bg-white border-gray-200 hover:border-brand/40'
              } ${allChecked ? 'opacity-60' : ''}`}
            >
              <Box checked={checked} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{region.label}</p>
                {region.subLabel && (
                  <p className="text-[11px] text-gray-500 truncate">{region.subLabel}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {allChecked && (
        <p className="text-[11px] text-gray-500">
          Listing will be shown to viewers in <strong>all regions</strong>. Tap a region above to limit visibility.
        </p>
      )}
    </div>
  )
}

function Box({ checked, brandWhenChecked }: { checked: boolean; brandWhenChecked?: boolean }) {
  return (
    <span
      className={`inline-flex w-4 h-4 mt-0.5 shrink-0 rounded border items-center justify-center transition-colors ${
        checked
          ? brandWhenChecked
            ? 'bg-white border-white text-brand'
            : 'bg-brand border-brand text-white'
          : 'bg-white border-gray-300 text-transparent'
      }`}
    >
      {checked && <Check className="w-3 h-3" strokeWidth={3} />}
    </span>
  )
}
