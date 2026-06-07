'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Monitor, Smartphone, Megaphone } from 'lucide-react'
import BannerImage from '@/components/home/BannerImage'
import type { BannerPlacement } from '@/lib/bannerPlacement'

const TONES = [
  'from-rose-200 via-pink-200 to-fuchsia-200',
  'from-violet-200 via-purple-200 to-fuchsia-200',
  'from-sky-200 via-indigo-200 to-blue-200',
  'from-amber-200 via-orange-200 to-rose-200',
]

/** Neutral profile-card placeholder for visual context around the banner. */
function PlaceholderCard({ tone }: { tone: string }) {
  return (
    <div className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${tone} aspect-[3/4]`}>
      <div className="absolute inset-0 flex items-end justify-center opacity-70">
        <div className="w-[70%] h-[80%] bg-white/40 rounded-t-[50%]" aria-hidden />
        <div className="absolute bottom-[34%] left-1/2 -translate-x-1/2 w-[26%] aspect-square bg-white/55 rounded-full" aria-hidden />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/45 to-transparent" aria-hidden />
    </div>
  )
}

function YourBannerBadge() {
  const t = useTranslations('components.placementMock')
  return (
    <div className="absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-1 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
      <Megaphone className="w-2.5 h-2.5" />
      {t('yourBanner')}
    </div>
  )
}

/** feed_wide — full-width 4:1 strip above the grid. */
function WidePreview({ src }: { src: string }) {
  return (
    <div className="space-y-2">
      <div className="relative w-full overflow-hidden rounded-xl border border-black/10 bg-slate-100 aspect-[4/1]">
        <YourBannerBadge />
        <BannerImage src={src} alt="" plain />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TONES.map((tone, i) => <PlaceholderCard key={i} tone={tone} />)}
      </div>
    </div>
  )
}

/** feed_card — one grid cell shaped like a profile card. */
function CardPreview({ src, isMobile }: { src: string; isMobile: boolean }) {
  const bannerCell = (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-white flex flex-col sm:flex-row">
      <div
        className={`relative overflow-hidden bg-slate-100 w-full aspect-[3/4] ${isMobile ? '' : 'sm:w-[36%] sm:min-w-[80px]'}`}
      >
        <YourBannerBadge />
        <BannerImage src={src} alt="" plain />
      </div>
      {!isMobile && (
        <div className="hidden sm:flex flex-1 flex-col min-w-0">
          <div style={{ height: 2, background: 'linear-gradient(90deg,#a78bfa,#ec4899)' }} />
          <div className="px-3 py-2.5 flex flex-col gap-1">
            <span className="self-start rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
              Sponsored
            </span>
            <div className="h-2.5 w-3/4 rounded bg-slate-200" />
            <div className="h-2 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="grid grid-cols-2 gap-2">
      <PlaceholderCard tone={TONES[0]} />
      {bannerCell}
      <PlaceholderCard tone={TONES[1]} />
      <PlaceholderCard tone={TONES[2]} />
    </div>
  )
}

/** sidebar_left desktop — tall 2:3 rail beside the grid. */
function SidebarDesktopPreview({ src }: { src: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-[32%] max-w-[160px] shrink-0">
        <div className="relative w-full overflow-hidden rounded-xl border border-black/10 bg-slate-100 aspect-[2/3]">
          <YourBannerBadge />
          <BannerImage src={src} alt="" plain />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2">
        {TONES.map((tone, i) => <PlaceholderCard key={i} tone={tone} />)}
      </div>
    </div>
  )
}

/** sidebar_left mobile — bottom promo strip (2:3 thumbs). */
function SidebarMobilePreview({ src }: { src: string }) {
  const t = useTranslations('components.placementMock')
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {TONES.map((tone, i) => <PlaceholderCard key={i} tone={tone} />)}
      </div>
      <div className="rounded-2xl border border-black/10 bg-white/95 shadow-md p-2">
        <div className="flex gap-2">
          {[0, 1].map(i => (
            <div
              key={i}
              className="relative overflow-hidden rounded-lg border border-black/10 bg-slate-100 shrink-0"
              style={{ width: 64, height: 96 }}
            >
              {i === 0 && <YourBannerBadge />}
              <BannerImage src={src} alt="" plain />
            </div>
          ))}
          <div className="flex-1 self-center text-[10px] font-medium text-slate-400">
            {t('yourBanner')}
          </div>
        </div>
      </div>
    </div>
  )
}

function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg">
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-2.5 py-1.5">
        <span className="h-2 w-2 rounded-full bg-red-400" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
        <div className="ml-1.5 flex-1 truncate rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-500">
          nicemodels.ch
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[300px] overflow-hidden rounded-[28px] border-[6px] border-slate-900 bg-slate-900 shadow-xl">
      <div className="relative bg-white">
        <div className="flex items-center justify-between px-3 py-1 text-[9px] font-semibold text-slate-900">
          <span>9:41</span>
          <span>●●● 100%</span>
        </div>
        <div className="border-t border-slate-100 p-2.5">{children}</div>
      </div>
    </div>
  )
}

interface BannerLivePreviewProps {
  placement: BannerPlacement
  previewUrl: string
}

/**
 * Faithful 1:1 preview of how the uploaded banner appears on the live site,
 * for both desktop and mobile. Uses the same full-image (contain + blurred
 * fill) rendering as production via BannerImage.
 */
export default function BannerLivePreview({ placement, previewUrl }: BannerLivePreviewProps) {
  const t = useTranslations('components.placementMock')
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop')
  const isMobile = mode === 'mobile'

  const body = (mobile: boolean) => {
    if (placement === 'feed_wide') return <WidePreview src={previewUrl} />
    if (placement === 'feed_card') return <CardPreview src={previewUrl} isMobile={mobile} />
    return mobile ? <SidebarMobilePreview src={previewUrl} /> : <SidebarDesktopPreview src={previewUrl} />
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-bold text-gray-800">{t('livePreviewTitle')}</p>
        <p className="text-xs text-gray-500 mt-0.5">{t('livePreviewHint')}</p>
      </div>

      <div className="grid grid-cols-2 gap-0.5 rounded-md border border-slate-200 bg-white p-0.5 max-w-[220px]">
        <button
          type="button"
          onClick={() => setMode('desktop')}
          className={`flex items-center justify-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
            !isMobile ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={!isMobile}
        >
          <Monitor className="w-3.5 h-3.5" />
          {t('desktop')}
        </button>
        <button
          type="button"
          onClick={() => setMode('mobile')}
          className={`flex items-center justify-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
            isMobile ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={isMobile}
        >
          <Smartphone className="w-3.5 h-3.5" />
          {t('mobile')}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50 p-3 flex justify-center">
        {isMobile ? <MobileFrame>{body(true)}</MobileFrame> : <DesktopFrame>{body(false)}</DesktopFrame>}
      </div>
    </div>
  )
}
