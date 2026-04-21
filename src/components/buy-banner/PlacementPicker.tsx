'use client'

import type { BannerPlacement } from '@/lib/bannerPlacement'
import { LayoutGrid, PanelLeft, Square } from 'lucide-react'
import { WireframeFeedWide, WireframeFeedCard, WireframeSidebarLeft } from './bannerWireframes'

const OPTIONS: {
  id: BannerPlacement
  title: string
  zone: string
  desc: string
  Wire: typeof WireframeFeedWide
  Icon: typeof LayoutGrid
}[] = [
  {
    id: 'feed_wide',
    title: 'Wide banner',
    zone: 'Spans both columns',
    desc: 'Full-width strip in the listing — repeats every 6 profile cards (4:1).',
    Wire: WireframeFeedWide,
    Icon: LayoutGrid,
  },
  {
    id: 'feed_card',
    title: 'Card slot',
    zone: 'Inside the grid',
    desc: 'Same cell size as a profile card — appears every 4 cards (3:4).',
    Wire: WireframeFeedCard,
    Icon: Square,
  },
  {
    id: 'sidebar_left',
    title: 'Left column',
    zone: 'Beside the feed',
    desc:
      'One vertical slot next to the grid on desktop/laptop. Not shown on phones — on mobile, only wide and card placements appear in the feed. Random pick per page load on desktop.',
    Wire: WireframeSidebarLeft,
    Icon: PanelLeft,
  },
]

interface PlacementPickerProps {
  value: BannerPlacement | null
  onChange: (p: BannerPlacement) => void
  disabledPlacements?: Set<BannerPlacement>
}

function PlacementPreviewLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-2.5 text-[12px] text-slate-600"
      role="note"
    >
      <span className="font-semibold text-slate-700">Preview key</span>
      <span className="flex items-center gap-2">
        <span
          className="h-4 w-4 shrink-0 rounded border border-slate-300/90 bg-gradient-to-b from-slate-200/95 to-slate-100 shadow-sm"
          aria-hidden
        />
        <span>Grey cells = profile cards (models &amp; clubs) in the listing</span>
      </span>
      <span className="hidden sm:inline text-slate-300" aria-hidden>
        ·
      </span>
      <span className="flex items-center gap-2">
        <span
          className="h-4 w-7 shrink-0 rounded border-2 border-violet-400/70 bg-gradient-to-r from-violet-300/90 to-fuchsia-200/85 shadow-sm"
          aria-hidden
        />
        <span>Violet = your ad</span>
      </span>
      <span className="hidden sm:inline text-slate-300" aria-hidden>
        ·
      </span>
      <span className="text-slate-600 sm:max-w-none">
        <span className="font-semibold text-slate-700">Left column</span> is{' '}
        <span className="font-semibold text-slate-800">desktop only</span> — it does not appear on mobile.
      </span>
    </div>
  )
}

export default function PlacementPicker({ value, onChange, disabledPlacements }: PlacementPickerProps) {
  return (
    <div className="space-y-3">
      <PlacementPreviewLegend />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
      {OPTIONS.map(opt => {
        const disabled = disabledPlacements?.has(opt.id)
        const selected = value === opt.id
        const W = opt.Wire
        const Icon = opt.Icon
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(opt.id)}
            className={`group text-left rounded-2xl border-2 p-4 sm:p-5 transition-all flex flex-col gap-4 min-h-0 ${
              disabled
                ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                : selected
                  ? 'border-violet-500 bg-gradient-to-b from-violet-50/95 to-white shadow-lg shadow-violet-500/10 ring-2 ring-violet-400/25'
                  : 'border-slate-200/90 bg-white hover:border-violet-300 hover:bg-slate-50/90 hover:shadow-md'
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
            </div>

            <div
              className={`pointer-events-none relative flex min-h-[160px] sm:min-h-[180px] items-center justify-center rounded-xl border p-4 sm:p-5 ${
                selected
                  ? 'border-violet-200/80 bg-gradient-to-b from-white to-violet-50/40 shadow-inner'
                  : 'border-slate-100 bg-gradient-to-b from-slate-50/90 to-slate-100/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]'
              }`}
            >
              <div className="w-full max-w-[260px] scale-[1.02] sm:scale-105 origin-center">
                <W showProfileCardLabels />
              </div>
            </div>

            <p className="text-[13px] text-slate-600 leading-relaxed flex-1">{opt.desc}</p>

            {disabled && (
              <p className="text-[11px] font-semibold text-emerald-700 rounded-lg bg-emerald-50 px-2.5 py-1.5 border border-emerald-100">
                Active in this slot
              </p>
            )}
          </button>
        )
      })}
      </div>
    </div>
  )
}
