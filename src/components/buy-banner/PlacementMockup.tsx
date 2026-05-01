'use client'

import { useState } from 'react'
import { Heart, MapPin, Megaphone, Menu, Monitor, Search, Smartphone, Star } from 'lucide-react'
import type { BannerPlacement } from '@/lib/bannerPlacement'

const TONES = [
  'from-rose-300 via-pink-300 to-fuchsia-300',
  'from-violet-300 via-purple-300 to-fuchsia-300',
  'from-sky-300 via-indigo-300 to-blue-300',
  'from-amber-300 via-orange-300 to-rose-300',
  'from-emerald-300 via-teal-300 to-cyan-300',
  'from-pink-300 via-rose-300 to-red-300',
]

function MiniModelCell({ tone }: { tone: string }) {
  return (
    <div className={`relative rounded overflow-hidden bg-gradient-to-br ${tone} aspect-[3/4] shadow-sm grayscale opacity-60`}>
      {/* Silhouette */}
      <div className="absolute inset-0 flex items-end justify-center">
        <div className="w-[70%] h-[80%] bg-white/35 rounded-t-[50%]" aria-hidden />
        <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 w-[26%] aspect-square bg-white/45 rounded-full" aria-hidden />
      </div>
      {/* Dark overlay bottom */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden />
      {/* Badges */}
      <div className="absolute top-0.5 left-0.5 bg-blue-500 text-white px-0.5 rounded-sm flex items-center gap-[1px]" style={{ fontSize: 4 }}>
        <Star className="w-[5px] h-[5px] fill-white" />
      </div>
      <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-white/80 flex items-center justify-center">
        <Heart className="w-1 h-1 text-rose-500" />
      </div>
      {/* Name/location overlay */}
      <div className="absolute bottom-0 left-0.5 right-0.5 text-white pb-0.5">
        <div className="flex items-center justify-between gap-0.5">
          <span className="font-extrabold truncate drop-shadow" style={{ fontSize: 5 }}>Name, 24</span>
          <span className="bg-emerald-500 rounded-full px-0.5 font-bold shadow" style={{ fontSize: 3 }}>live</span>
        </div>
        <div className="flex items-center gap-[1px] text-white/90" style={{ fontSize: 4 }}>
          <MapPin className="w-[5px] h-[5px] shrink-0" />
          <span className="truncate">Zurich</span>
        </div>
      </div>
    </div>
  )
}

const HIGHLIGHT_RING = 'ring-2 ring-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.35),0_6px_16px_-4px_rgba(139,92,246,0.45)] z-10'

function WideBanner({ previewUrl }: { previewUrl?: string | null }) {
  if (previewUrl) {
    return (
      <div className={`relative rounded overflow-hidden ${HIGHLIGHT_RING}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="" className="w-full aspect-[4/1] object-cover" />
        <div className="absolute top-0.5 left-0.5 bg-violet-600 text-white px-1 py-[1px] rounded font-extrabold flex items-center gap-0.5 shadow" style={{ fontSize: 5 }}>
          <Megaphone className="w-[5px] h-[5px]" />
          YOUR AD
        </div>
      </div>
    )
  }
  return (
    <div className={`relative aspect-[4/1] rounded ${HIGHLIGHT_RING} bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center gap-0.5 text-white overflow-hidden`}>
      <div
        className="absolute inset-0 opacity-25"
        style={{ backgroundImage: 'radial-gradient(circle, white 0.6px, transparent 0.6px)', backgroundSize: '6px 6px' }}
        aria-hidden
      />
      <div className="relative flex items-center gap-1">
        <Megaphone className="w-2 h-2" />
        <span className="font-extrabold tracking-wide" style={{ fontSize: 6 }}>YOUR WIDE BANNER</span>
      </div>
    </div>
  )
}

function CardBannerCell({ previewUrl }: { previewUrl?: string | null }) {
  if (previewUrl) {
    return (
      <div className={`relative aspect-[3/4] rounded overflow-hidden ${HIGHLIGHT_RING}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-0.5 left-0.5 bg-violet-600 text-white px-1 py-[1px] rounded font-extrabold flex items-center gap-0.5 shadow" style={{ fontSize: 5 }}>
          <Megaphone className="w-[5px] h-[5px]" />
          YOUR AD
        </div>
      </div>
    )
  }
  return (
    <div className={`relative aspect-[3/4] rounded ${HIGHLIGHT_RING} bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex flex-col items-center justify-center gap-0.5 text-white overflow-hidden p-1`}>
      <div
        className="absolute inset-0 opacity-25"
        style={{ backgroundImage: 'radial-gradient(circle, white 0.6px, transparent 0.6px)', backgroundSize: '5px 5px' }}
        aria-hidden
      />
      <Megaphone className="relative w-3 h-3" />
      <span className="relative font-extrabold text-center leading-tight" style={{ fontSize: 6 }}>YOUR CARD</span>
      <span className="relative opacity-90 text-center" style={{ fontSize: 5 }}>Same as profile</span>
    </div>
  )
}

function SidebarBannerCell({ previewUrl }: { previewUrl?: string | null }) {
  if (previewUrl) {
    return (
      <div className={`relative w-full h-full rounded overflow-hidden ${HIGHLIGHT_RING} min-h-[120px]`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-0.5 left-0.5 right-0.5 bg-violet-600 text-white px-1 py-[1px] rounded font-extrabold flex items-center justify-center gap-0.5 shadow" style={{ fontSize: 5 }}>
          <Megaphone className="w-[5px] h-[5px]" />
          YOURS
        </div>
      </div>
    )
  }
  return (
    <div className={`relative w-full h-full rounded ${HIGHLIGHT_RING} bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500 flex flex-col items-center justify-center gap-0.5 text-white overflow-hidden p-1 min-h-[120px]`}>
      <div
        className="absolute inset-0 opacity-25"
        style={{ backgroundImage: 'radial-gradient(circle, white 0.6px, transparent 0.6px)', backgroundSize: '5px 5px' }}
        aria-hidden
      />
      <Megaphone className="relative w-2.5 h-2.5" />
      <span className="relative font-extrabold text-center leading-tight" style={{ fontSize: 5 }}>YOUR LEFT</span>
      <span className="relative font-extrabold text-center leading-tight" style={{ fontSize: 5 }}>COLUMN</span>
      <span className="relative opacity-90 text-center" style={{ fontSize: 4 }}>Desktop only</span>
    </div>
  )
}

function SiteHeader({ isMobile }: { isMobile: boolean }) {
  return (
    <div className={`bg-white border-b border-slate-200 flex items-center justify-between px-1 ${isMobile ? 'h-3.5' : 'h-4'}`}>
      {isMobile ? (
        <>
          <Menu className="w-2 h-2 text-slate-600 shrink-0" />
          <span
            className="font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent"
            style={{ fontSize: 6 }}
          >
            nicemodels
          </span>
          <Search className="w-1.5 h-1.5 text-slate-400 shrink-0" />
        </>
      ) : (
        <>
          <span
            className="font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent"
            style={{ fontSize: 7 }}
          >
            nicemodels
          </span>
          <nav className="flex items-center gap-1 font-semibold text-slate-700" style={{ fontSize: 5 }}>
            <span className="text-rose-600">Home</span>
            <span>Girls</span>
            <span>Clubs</span>
            <span>Jobs</span>
          </nav>
          <div className="flex items-center gap-0.5 bg-slate-100 rounded px-1 py-0.5">
            <Search className="w-1.5 h-1.5 text-slate-400 shrink-0" />
            <span className="text-slate-400" style={{ fontSize: 4 }}>Search</span>
          </div>
        </>
      )}
    </div>
  )
}

function FilterChips() {
  return (
    <div className="flex items-center gap-0.5 px-1 py-0.5 bg-white border-b border-slate-100 overflow-hidden" style={{ fontSize: 4 }}>
      {['All', 'Zurich', 'Geneva', 'Basel'].map((f, i) => (
        <span
          key={f}
          className={`shrink-0 rounded-full font-semibold border px-1 py-[1px] ${
            i === 0
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600'
              : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          {f}
        </span>
      ))}
    </div>
  )
}

function FeedBody({
  placement,
  previewUrl,
  isMobile,
}: {
  placement: BannerPlacement
  previewUrl?: string | null
  isMobile: boolean
}) {
  // Sidebar is desktop-only — show message on mobile
  if (placement === 'sidebar_left' && isMobile) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 text-center py-6 px-2">
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
          <Smartphone className="w-3 h-3 text-amber-600" />
        </div>
        <p className="font-bold text-amber-900 leading-tight" style={{ fontSize: 7 }}>
          Not shown on mobile
        </p>
        <p className="text-slate-600 leading-tight" style={{ fontSize: 6 }}>
          Left-column banners
          <br />
          appear on desktop only
        </p>
      </div>
    )
  }

  if (placement === 'sidebar_left') {
    return (
      <div className="p-1 flex gap-1">
        <div className="w-[32%] shrink-0 flex">
          <SidebarBannerCell previewUrl={previewUrl} />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-0.5">
          {TONES.slice(0, 4).map((t, i) => (
            <MiniModelCell key={i} tone={t} />
          ))}
        </div>
      </div>
    )
  }

  if (placement === 'feed_wide') {
    return (
      <div className="p-1 space-y-1">
        <WideBanner previewUrl={previewUrl} />
        <div className="grid grid-cols-2 gap-0.5">
          {TONES.slice(0, 4).map((t, i) => (
            <MiniModelCell key={i} tone={t} />
          ))}
        </div>
      </div>
    )
  }

  // feed_card: banner occupies one cell in the 2-col grid
  return (
    <div className="p-1">
      <div className="grid grid-cols-2 gap-0.5">
        <MiniModelCell tone={TONES[0]} />
        <CardBannerCell previewUrl={previewUrl} />
        <MiniModelCell tone={TONES[1]} />
        <MiniModelCell tone={TONES[2]} />
      </div>
    </div>
  )
}

interface PlacementMockupProps {
  placement: BannerPlacement
  previewUrl?: string | null
}

export default function PlacementMockup({ placement, previewUrl }: PlacementMockupProps) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop')
  const isMobile = mode === 'mobile'

  const stopClick = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div className="space-y-2">
      {/* Toggle */}
      <div
        className="grid grid-cols-2 rounded-md border border-slate-200 bg-white p-0.5 shadow-sm"
        onClick={stopClick}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setMode('desktop')
          }}
          className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
            !isMobile ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={!isMobile}
        >
          <Monitor className="w-3 h-3" />
          Desktop
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setMode('mobile')
          }}
          className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
            isMobile ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={isMobile}
        >
          <Smartphone className="w-3 h-3" />
          Mobile
        </button>
      </div>

      {/* Frame area */}
      <div className="rounded-lg bg-gradient-to-b from-slate-100 to-slate-50 border border-slate-200 p-2 flex items-start justify-center min-h-[180px]">
        {isMobile ? (
          // Phone frame
          <div className="relative rounded-[16px] border-[4px] border-slate-900 bg-slate-900 shadow-lg overflow-hidden w-[130px]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-10 h-2 bg-slate-900 rounded-b-lg flex items-center justify-center gap-0.5">
              <span className="w-5 h-[2px] rounded-full bg-slate-700" aria-hidden />
            </div>
            <div className="relative bg-white overflow-hidden" style={{ minHeight: 170 }}>
              {/* Status bar */}
              <div className="h-2.5 flex items-center justify-between px-1.5 text-slate-900 font-semibold" style={{ fontSize: 4 }}>
                <span>9:41</span>
                <span>●●● 100%</span>
              </div>
              <SiteHeader isMobile />
              <FilterChips />
              <FeedBody placement={placement} previewUrl={previewUrl} isMobile />
            </div>
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-white/80" aria-hidden />
          </div>
        ) : (
          // Desktop browser frame
          <div className="w-full rounded border border-slate-300 bg-white shadow-lg overflow-hidden">
            <div className="flex items-center gap-1 bg-slate-100 border-b border-slate-200 px-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" aria-hidden />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
              <div
                className="flex-1 ml-1 bg-white rounded border border-slate-200 px-1 py-0.5 text-slate-500 font-mono truncate"
                style={{ fontSize: 5 }}
              >
                nicemodels.ch
              </div>
            </div>
            <SiteHeader isMobile={false} />
            <FilterChips />
            <FeedBody placement={placement} previewUrl={previewUrl} isMobile={false} />
          </div>
        )}
      </div>
    </div>
  )
}
