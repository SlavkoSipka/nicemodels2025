'use client'

import type { BannerPlacement } from '@/lib/bannerPlacement'
import { LayoutGrid, PanelLeft, Square } from 'lucide-react'
import PlacementMockup from './PlacementMockup'

const OPTIONS: {
  id: BannerPlacement
  title: string
  zone: string
  desc: string
  Icon: typeof LayoutGrid
}[] = [
  {
    id: 'feed_wide',
    title: 'Wide banner',
    zone: 'Spans both columns',
    desc: 'Full-width strip in the listing — repeats every 6 profile cards (4:1).',
    Icon: LayoutGrid,
  },
  {
    id: 'feed_card',
    title: 'Card slot',
    zone: 'Inside the grid',
    desc: 'Same cell size as a profile card — appears every 4 cards (3:4).',
    Icon: Square,
  },
  {
    id: 'sidebar_left',
    title: 'Left column',
    zone: 'Beside the feed',
    desc:
      'One vertical slot next to the grid on desktop/laptop. Not shown on phones — on mobile, only wide and card placements appear in the feed. Random pick per page load on desktop.',
    Icon: PanelLeft,
  },
]

interface PlacementPickerProps {
  value: BannerPlacement | null
  onChange: (p: BannerPlacement) => void
  disabledPlacements?: Set<BannerPlacement>
  previewUrl?: string | null
}

export default function PlacementPicker({
  value,
  onChange,
  disabledPlacements,
  previewUrl,
}: PlacementPickerProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
      {OPTIONS.map(opt => {
        const disabled = disabledPlacements?.has(opt.id)
        const selected = value === opt.id
        const Icon = opt.Icon

        const handleSelect = () => {
          if (disabled) return
          onChange(opt.id)
        }

        return (
          <div
            key={opt.id}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-pressed={selected}
            aria-disabled={disabled}
            onClick={handleSelect}
            onKeyDown={(e) => {
              if (disabled) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleSelect()
              }
            }}
            className={`group text-left rounded-2xl border-2 p-4 sm:p-5 transition-all flex flex-col gap-3 min-h-0 outline-none ${
              disabled
                ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                : selected
                  ? 'border-violet-500 bg-gradient-to-b from-violet-50/95 to-white shadow-lg shadow-violet-500/10 ring-2 ring-violet-400/25 cursor-pointer'
                  : 'border-slate-200/90 bg-white hover:border-violet-300 hover:bg-slate-50/90 hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    selected
                      ? 'border-violet-200 bg-violet-100 text-violet-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 group-hover:border-violet-200 group-hover:bg-violet-50/80 group-hover:text-violet-600'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600/90">{opt.zone}</p>
                  <p className="text-base font-bold text-slate-900 leading-tight mt-0.5">{opt.title}</p>
                </div>
              </div>
              {selected && (
                <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold shadow">
                  ✓
                </span>
              )}
            </div>

            <PlacementMockup placement={opt.id} previewUrl={selected ? previewUrl : undefined} />

            <p className="text-[12px] text-slate-600 leading-relaxed flex-1">{opt.desc}</p>

            {disabled && (
              <p className="text-[11px] font-semibold text-emerald-700 rounded-lg bg-emerald-50 px-2.5 py-1.5 border border-emerald-100">
                Active in this slot
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
