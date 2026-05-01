'use client'

import { Briefcase, Home, MapPin, Search, Menu, Clock, DollarSign } from 'lucide-react'
import type { PreviewHighlight, PreviewMode } from '../types'

interface JobsRentsMockProps {
  mode: PreviewMode
  highlight: PreviewHighlight
  listingTitle?: string
  listingLocation?: string
}

const FAKE_LISTINGS: Array<{
  type: 'job' | 'rent'
  title: string
  location: string
  meta: string
  tone: string
}> = [
  { type: 'job', title: 'Receptionist wanted — evenings', location: 'Zurich', meta: 'Full-time · CHF 4500/mo', tone: 'from-blue-300 to-indigo-400' },
  { type: 'rent', title: 'Private room with kitchen, central', location: 'Geneva', meta: 'CHF 120 / day', tone: 'from-amber-300 to-orange-400' },
  { type: 'job', title: 'Hostess needed — weekend shifts', location: 'Basel', meta: 'Part-time', tone: 'from-violet-300 to-purple-400' },
  { type: 'rent', title: 'Furnished studio near station', location: 'Bern', meta: 'CHF 900 / week', tone: 'from-emerald-300 to-teal-400' },
  { type: 'job', title: 'Masseuse — night shift', location: 'Lausanne', meta: 'Shift work', tone: 'from-rose-300 to-pink-400' },
]

function ListingRow({
  type,
  title,
  location,
  meta,
  tone,
  highlighted = false,
  compact = false,
}: {
  type: 'job' | 'rent'
  title: string
  location: string
  meta: string
  tone: string
  highlighted?: boolean
  compact?: boolean
}) {
  const isJob = type === 'job'
  const Icon = isJob ? Briefcase : Home
  const badgeCls = isJob
    ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-amber-100 text-amber-700 border-amber-200'
  const accentColor = isJob ? 'from-blue-600 to-indigo-600' : 'from-amber-600 to-orange-600'

  return (
    <div
      className={`relative rounded-lg overflow-hidden bg-white flex ${compact ? 'flex-col' : 'flex-row'} transition-all ${
        highlighted
          ? 'ring-2 ring-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.3),0_8px_24px_-6px_rgba(139,92,246,0.45)] z-10'
          : 'border border-slate-200 shadow-sm grayscale opacity-60'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-1.5 left-2 z-20 bg-violet-600 text-white px-1.5 py-0.5 rounded-md text-[8px] font-extrabold shadow-lg">
          YOUR LISTING
        </div>
      )}

      {/* Photo */}
      <div
        className={`relative bg-gradient-to-br ${tone} shrink-0 ${
          compact ? 'w-full h-20' : 'w-[110px] h-[90px]'
        }`}
      >
        {/* Type gradient bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accentColor}`} />

        {/* Mock photo content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`${compact ? 'w-8 h-8' : 'w-7 h-7'} text-white/70 drop-shadow`} />
        </div>

        {/* Type badge */}
        <span
          className={`absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 font-extrabold ${badgeCls} ${
            compact ? 'text-[7px]' : 'text-[8px]'
          }`}
        >
          <Icon className={compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
          {isJob ? 'JOB' : 'RENT'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-2 flex flex-col justify-between gap-1">
        <div className="space-y-0.5 min-w-0">
          <p className={`font-extrabold text-slate-900 leading-tight line-clamp-1 ${compact ? 'text-[11px]' : 'text-[12px]'}`}>
            {title}
          </p>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="inline-flex items-center gap-0.5">
              <MapPin className={compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
              <span className={compact ? 'text-[8px]' : 'text-[9px]'}>{location}</span>
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Clock className={compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
              <span className={compact ? 'text-[8px]' : 'text-[9px]'}>2h ago</span>
            </span>
          </div>
        </div>

        {/* Services / chips */}
        <div className="flex flex-wrap gap-0.5">
          {isJob ? (
            <>
              <span className="text-[6px] font-bold text-slate-700 bg-slate-100 rounded px-1 py-0.5">
                Experience
              </span>
              <span className="text-[6px] font-bold text-slate-700 bg-slate-100 rounded px-1 py-0.5">
                Flexible hours
              </span>
            </>
          ) : (
            <>
              <span className="text-[6px] font-bold text-slate-700 bg-slate-100 rounded px-1 py-0.5">
                Furnished
              </span>
              <span className="text-[6px] font-bold text-slate-700 bg-slate-100 rounded px-1 py-0.5">
                Kitchen
              </span>
              <span className="text-[6px] font-bold text-slate-700 bg-slate-100 rounded px-1 py-0.5">
                Bathroom
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className={`inline-flex items-center gap-0.5 font-extrabold text-slate-800 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
            <DollarSign className={compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
            {meta}
          </span>
          <span
            className={`rounded-md bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold px-2 py-0.5 shadow-sm ${
              compact ? 'text-[7px]' : 'text-[8px]'
            }`}
          >
            View details
          </span>
        </div>
      </div>
    </div>
  )
}

function SiteHeader({ compact = false }: { compact?: boolean }) {
  const h = compact ? 'h-8' : 'h-10'
  return (
    <div className={`${h} bg-white border-b border-slate-200 flex items-center justify-between px-2.5 sticky top-0 z-10`}>
      <div className="flex items-center gap-1.5">
        {compact && <Menu className="w-3.5 h-3.5 text-slate-700" />}
        <span className={`font-black tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent ${compact ? 'text-[11px]' : 'text-sm'}`}>
          nicemodels
        </span>
      </div>
      {!compact && (
        <nav className="flex items-center gap-3 text-[9px] font-semibold text-slate-700">
          <span>Home</span>
          <span>Girls</span>
          <span>Clubs</span>
          <span className="text-rose-600">Jobs &amp; Rent</span>
        </nav>
      )}
      <div className="flex items-center gap-1.5">
        <div className={`flex items-center gap-1 bg-slate-100 rounded-md px-1.5 py-1 ${compact ? 'w-16' : 'w-24'}`}>
          <Search className="w-2.5 h-2.5 text-slate-500 shrink-0" />
          <span className="text-[7px] text-slate-400 truncate">Search</span>
        </div>
      </div>
    </div>
  )
}

export default function JobsRentsMock({
  mode,
  highlight,
  listingTitle,
  listingLocation,
}: JobsRentsMockProps) {
  const compact = mode === 'mobile'
  const yourType: 'job' | 'rent' = highlight === 'listing-rent' ? 'rent' : 'job'

  const yourListing = {
    type: yourType,
    title: listingTitle?.trim() || (yourType === 'job' ? 'Your job title' : 'Your rental title'),
    location: listingLocation?.trim() || 'Your city',
    meta: yourType === 'job' ? 'Full-time' : 'CHF 100 / day',
    tone: 'from-violet-400 via-fuchsia-400 to-pink-400',
  }

  const othersToShow = compact ? 3 : 4

  return (
    <div className="bg-slate-50 w-full">
      <SiteHeader compact={compact} />

      {/* Page title + tabs */}
      <div className="px-3 py-2 bg-white border-b border-slate-100">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className={`font-extrabold text-slate-900 ${compact ? 'text-sm' : 'text-base'}`}>
              Jobs &amp; Rent
            </p>
            <p className={`text-slate-500 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
              Open positions and rentals from clubs
            </p>
          </div>
          <div className="flex gap-1">
            {[
              { label: 'All', count: 47 },
              { label: 'Jobs', count: 23 },
              { label: 'Rent', count: 24 },
            ].map((t, i) => (
              <span
                key={t.label}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-semibold border ${
                  compact ? 'text-[7px]' : 'text-[8px]'
                } ${
                  i === 0
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {t.label}
                <span className={i === 0 ? 'text-white/80' : 'text-slate-400'}>{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Single column list */}
      <div className="p-2 space-y-2">
        <ListingRow {...FAKE_LISTINGS[0]} compact={compact} />
        <ListingRow {...yourListing} highlighted compact={compact} />
        {FAKE_LISTINGS.slice(1, 1 + othersToShow).map((l, i) => (
          <ListingRow key={i} {...l} compact={compact} />
        ))}
      </div>
    </div>
  )
}
