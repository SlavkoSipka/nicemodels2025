'use client'

import { Megaphone } from 'lucide-react'

const bannerTint =
  'border-violet-400/80 bg-gradient-to-r from-violet-300/95 via-fuchsia-200/90 to-violet-300/95 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.12)]'

function GreyCell({
  className = '',
  annotateProfile = false,
}: {
  className?: string
  annotateProfile?: boolean
}) {
  return (
    <div
      className={`relative rounded border border-slate-200/90 bg-gradient-to-b from-slate-200/90 to-slate-100 shadow-sm ${className}`}
      aria-hidden
    >
      {annotateProfile && (
        <span className="absolute inset-x-0 bottom-0.5 px-0.5 text-[5px] sm:text-[6px] text-center font-bold text-slate-600/95 leading-none">
          model
        </span>
      )}
    </div>
  )
}

function ProfileCardsCaption({
  show,
  className = '',
  variant = 'default',
}: {
  show: boolean
  className?: string
  variant?: 'default' | 'card'
}) {
  if (!show) return null
  const text =
    variant === 'card'
      ? 'Grey cells = model profile cards · violet = your ad'
      : 'Model profile cards'
  return (
    <p
      className={`text-[7px] sm:text-[8px] text-center text-slate-500 font-semibold leading-tight mt-1 ${className}`}
    >
      {text}
    </p>
  )
}

/** Wide row (4:1) spanning both columns — feed_wide */
export function WireframeFeedWide({
  compact = false,
  showProfileCardLabels = false,
}: {
  compact?: boolean
  showProfileCardLabels?: boolean
}) {
  const hStrip = compact ? 'h-5' : 'h-7 sm:h-8'
  const hCard = compact ? 'min-h-[28px]' : 'min-h-[36px]'
  return (
    <div className={`rounded-lg border border-slate-200/80 bg-white p-1.5 space-y-1 ${compact ? 'w-full' : ''}`}>
      <div className="flex gap-0.5">
        <div className="h-1 flex-1 rounded bg-slate-200" />
        <div className="h-1 w-4 rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div
          className={`col-span-2 rounded-md flex items-center justify-center gap-0.5 px-1 ${bannerTint} ${hStrip}`}
        >
          <Megaphone className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-violet-900 shrink-0`} />
          <span className={`${compact ? 'text-[7px]' : 'text-[8px]'} font-extrabold text-violet-950 leading-none`}>
            Wide
          </span>
        </div>
      </div>
      <div className="rounded-md border border-dashed border-slate-200/90 bg-slate-50/50 p-1">
        <div className="grid grid-cols-2 gap-1">
          <GreyCell className={hCard} annotateProfile={showProfileCardLabels} />
          <GreyCell className={hCard} annotateProfile={showProfileCardLabels} />
          <GreyCell className={hCard} annotateProfile={showProfileCardLabels} />
          <GreyCell className={hCard} annotateProfile={showProfileCardLabels} />
        </div>
        <ProfileCardsCaption show={showProfileCardLabels} />
      </div>
    </div>
  )
}

/** One grid cell — feed_card */
export function WireframeFeedCard({
  compact = false,
  showProfileCardLabels = false,
}: {
  compact?: boolean
  showProfileCardLabels?: boolean
}) {
  const cell = compact ? 'min-h-[26px]' : 'min-h-[34px]'
  return (
    <div className={`rounded-lg border border-slate-200/80 bg-white p-1.5 space-y-1 ${compact ? 'w-full' : ''}`}>
      <div className="flex gap-0.5">
        <div className="h-1 flex-1 rounded bg-slate-200" />
        <div className="h-1 w-4 rounded bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div
          className={`rounded-md flex flex-col items-center justify-center ${bannerTint} ${cell} ${compact ? 'p-0.5' : 'p-1'}`}
        >
          <Megaphone className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-violet-900`} />
          <span
            className={`${compact ? 'text-[6px]' : 'text-[7px]'} font-extrabold text-violet-950 leading-none mt-0.5`}
          >
            Card
          </span>
        </div>
        <GreyCell className={cell} annotateProfile={showProfileCardLabels} />
        <GreyCell className={cell} annotateProfile={showProfileCardLabels} />
        <GreyCell className={cell} annotateProfile={showProfileCardLabels} />
      </div>
      <ProfileCardsCaption show={showProfileCardLabels} variant="card" />
    </div>
  )
}

/** Left rail + grid — sidebar_left */
export function WireframeSidebarLeft({
  compact = false,
  showProfileCardLabels = false,
}: {
  compact?: boolean
  showProfileCardLabels?: boolean
}) {
  const cell = compact ? 'min-h-[14px]' : 'min-h-[18px]'
  const railW = compact ? 'w-[28%]' : 'w-[30%]'
  return (
    <div className={`rounded-lg border border-slate-200/80 bg-white p-1.5 ${compact ? 'w-full' : ''}`}>
      <div className="flex gap-0.5 mb-1">
        <div className="h-1 flex-1 rounded bg-slate-200" />
        <div className="h-1 w-4 rounded bg-slate-200" />
      </div>
      <div className="flex gap-1 items-stretch min-h-[52px]">
        <div
          className={`shrink-0 ${railW} rounded-md flex flex-col items-center justify-center gap-0.5 px-0.5 ${bannerTint}`}
        >
          <Megaphone className={`${compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} text-violet-900`} />
          <span className={`${compact ? 'text-[5px]' : 'text-[6px]'} font-extrabold text-violet-950 text-center leading-tight`}>
            Left
          </span>
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="rounded-md border border-dashed border-slate-200/90 bg-slate-50/50 p-0.5 flex-1 grid grid-cols-2 gap-0.5">
            <GreyCell className={cell} annotateProfile={showProfileCardLabels} />
            <GreyCell className={cell} annotateProfile={showProfileCardLabels} />
            <GreyCell className={cell} annotateProfile={showProfileCardLabels} />
            <GreyCell className={cell} annotateProfile={showProfileCardLabels} />
          </div>
          <ProfileCardsCaption show={showProfileCardLabels} />
        </div>
      </div>
    </div>
  )
}
