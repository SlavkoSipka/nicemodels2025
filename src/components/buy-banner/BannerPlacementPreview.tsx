'use client'

import { Shuffle } from 'lucide-react'

function PlacementRhythmStrip() {
  return (
    <div className="mt-1 pt-4 border-t border-slate-100 space-y-4">
      <p className="text-xs font-semibold text-slate-700">How placements appear in the feed</p>

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3 overflow-x-auto">
        <p className="text-[11px] font-medium text-slate-600 mb-2">Wide — full row</p>
        <div className="flex items-stretch gap-1.5 min-w-[280px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-8 shrink-0 rounded-lg border border-slate-200 bg-gradient-to-b from-slate-200 to-slate-300 shadow-sm"
              aria-hidden
            />
          ))}
          <div className="flex-1 min-w-[108px] rounded-xl border-2 border-violet-400/70 bg-gradient-to-r from-violet-300/90 to-fuchsia-200/90 flex items-center justify-center px-1.5 shadow-[0_4px_14px_-2px_rgba(139,92,246,0.3)]">
            <span className="text-[8px] sm:text-[9px] font-bold text-violet-950 text-center leading-tight">
              Next wide
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          One wide strip <span className="font-semibold text-slate-700">at the top</span> of the grid; then again after{' '}
          <span className="font-semibold text-slate-700">every 6 model cards</span> in the linear feed.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3 overflow-x-auto">
        <p className="text-[11px] font-medium text-slate-600 mb-2">Card slot — one grid cell</p>
        <div className="flex items-stretch gap-1.5 min-w-[220px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-8 shrink-0 rounded-lg border border-slate-200 bg-gradient-to-b from-slate-200 to-slate-300 shadow-sm"
              aria-hidden
            />
          ))}
          <div className="w-14 shrink-0 rounded-lg border-2 border-violet-400/70 bg-gradient-to-b from-violet-300/90 to-fuchsia-200/90 flex items-center justify-center shadow-[0_4px_14px_-2px_rgba(139,92,246,0.3)]">
            <span className="text-[7px] font-bold text-violet-950 text-center leading-tight px-0.5">Card</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          Card promos appear <span className="font-semibold text-slate-700">every 4 model cards</span> (same size as a
          profile card).
        </p>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed rounded-lg border border-slate-100 bg-white/60 px-3 py-2">
        <span className="font-semibold text-slate-700">Left column</span> (desktop / large screens only):{' '}
        <span className="font-semibold text-slate-700">one</span> vertical slot next to the grid.{' '}
        <span className="font-semibold text-slate-800">Not shown on phones</span> — mobile visitors only see wide and card
        placements in the feed. If several advertisers bought this placement,{' '}
        <span className="font-semibold text-slate-700">which one shows is random each time you load or refresh</span>{' '}
        on desktop — not a stack of multiple ads.
      </p>
    </div>
  )
}

function CopyForRole({ ownerType }: { ownerType: 'model' | 'club' }) {
  const who = ownerType === 'model' ? 'Your' : 'Your club’s'
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-slate-600 leading-relaxed">
        Choose a <span className="font-semibold text-slate-800">placement type</span> when you buy:{' '}
        <span className="font-semibold text-slate-800">wide</span> (full row),{' '}
        <span className="font-semibold text-slate-800">card</span> (one grid cell), or{' '}
        <span className="font-semibold text-slate-800">left column</span> (desktop rail — not on mobile). Grey blocks are
        other profiles; the <span className="font-semibold text-violet-800">violet</span> area is your ad.
      </p>
      <p className="text-xs text-slate-600 leading-relaxed">
        {who} placements can surface on <span className="font-semibold text-slate-800">Home</span>,{' '}
        <span className="font-semibold text-slate-800">Girls</span> (
        <span className="font-mono text-[11px] text-slate-500">/models-page</span>),{' '}
        <span className="font-semibold text-slate-800">Clubs</span>,{' '}
        <span className="font-semibold text-slate-800">Jobs &amp; Rent</span>, and similar browse views.
      </p>
    </div>
  )
}

function FairRotationNote() {
  return (
    <div className="flex gap-3 rounded-xl border border-violet-200/70 bg-gradient-to-r from-violet-50/90 to-fuchsia-50/40 p-3 sm:p-3.5">
      <Shuffle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" aria-hidden />
      <p className="text-xs text-slate-700 leading-relaxed">
        <span className="font-semibold text-slate-900">Fair rotation:</span> For <span className="font-semibold text-slate-800">wide</span> and{' '}
        <span className="font-semibold text-slate-800">card</span> pools, if several banners are active,{' '}
        <span className="font-semibold text-slate-800">which one appears in each slot is randomised on each load or refresh</span>{' '}
        so advertisers get similar chances. The <span className="font-semibold text-slate-800">left column</span> shows a
        single ad on desktop only (hidden on mobile); see below.
      </p>
    </div>
  )
}

export default function BannerPlacementPreview({ ownerType }: { ownerType: 'model' | 'club' }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/40 to-violet-50/30 p-4 md:p-6 space-y-5 shadow-[0_2px_16px_rgba(15,23,42,0.04)] ring-1 ring-slate-100/80">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Where your banner appears</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100/90 border border-violet-200/80 px-2 py-0.5 rounded-full">
            Placements
          </span>
        </div>
        <CopyForRole ownerType={ownerType} />
        <FairRotationNote />
      </div>

      <PlacementRhythmStrip />
    </div>
  )
}
