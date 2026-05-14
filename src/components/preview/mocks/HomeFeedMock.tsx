'use client'

import { useTranslations } from 'next-intl'
import { Heart, Megaphone, Search, User, Menu, MapPin, Sparkles, Star } from 'lucide-react'
import MobileLeftBannerBottomPreview from '../MobileLeftBannerBottomPreview'
import type { PreviewHighlight, PreviewMode } from '../types'

interface HomeFeedMockProps {
  mode: PreviewMode
  highlight: PreviewHighlight
  previewUrl?: string
  compact?: boolean
}

const FAKE_MODELS = [
  { name: 'Sofia', city: 'Zurich', tone: 'from-rose-300 via-pink-300 to-fuchsia-300', age: 24 },
  { name: 'Emma', city: 'Geneva', tone: 'from-violet-300 via-purple-300 to-fuchsia-300', age: 22 },
  { name: 'Luna', city: 'Basel', tone: 'from-sky-300 via-indigo-300 to-blue-300', age: 25 },
  { name: 'Nina', city: 'Bern', tone: 'from-amber-300 via-orange-300 to-rose-300', age: 23 },
  { name: 'Mia', city: 'Lucerne', tone: 'from-emerald-300 via-teal-300 to-cyan-300', age: 26 },
  { name: 'Aria', city: 'Lausanne', tone: 'from-pink-300 via-rose-300 to-red-300', age: 21 },
  { name: 'Zoe', city: 'Zug', tone: 'from-purple-300 via-violet-400 to-indigo-300', age: 27 },
  { name: 'Ivy', city: 'St. Gallen', tone: 'from-cyan-300 via-sky-400 to-blue-400', age: 24 },
]

function ModelCardMock({
  model,
  highlighted,
  label,
}: {
  model: { name: string; city: string; tone: string; age: number }
  highlighted?: boolean
  label?: string
}) {
  const t = useTranslations('components.bannerPreviewMock')
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-white flex flex-col transition-all ${
        highlighted
          ? 'ring-2 ring-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.3),0_8px_24px_-6px_rgba(139,92,246,0.45)] z-10'
          : 'border border-slate-200 shadow-sm grayscale opacity-60'
      }`}
    >
      <div className={`aspect-[3/4] bg-gradient-to-br ${model.tone} relative overflow-hidden`}>
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="w-[70%] h-[80%] bg-gradient-to-t from-white/10 to-white/40 rounded-t-[50%]" aria-hidden />
          <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 w-[25%] aspect-square bg-white/45 rounded-full" aria-hidden />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden />

        <div className="absolute top-1 left-1 bg-blue-500 text-white px-1 py-0.5 rounded text-[7px] font-bold flex items-center gap-0.5 shadow">
          <Star className="w-2 h-2 fill-white" />
          {t('verifiedShort')}
        </div>

        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow">
          <Heart className="w-2.5 h-2.5 text-rose-500" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-1.5 text-white">
          <div className="flex items-center justify-between gap-1">
            <span className="font-extrabold text-[11px] leading-tight truncate drop-shadow">
              {model.name}, {model.age}
            </span>
            <span className="inline-flex items-center gap-0.5 bg-emerald-500 rounded-full px-1 py-0.5 text-[6px] font-bold shadow">
              <span className="w-1 h-1 rounded-full bg-white" />
              {t('live')}
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-[8px] font-medium text-white/90 mt-0.5">
            <MapPin className="w-2 h-2 shrink-0" />
            <span className="truncate">{model.city}</span>
          </div>
        </div>

        {highlighted && (
          <>
            <div className="absolute inset-0 bg-violet-600/25" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-extrabold flex items-center gap-1 shadow-lg whitespace-nowrap">
              <User className="w-2.5 h-2.5" />
              {label ?? t('yourCardBadge')}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-0.5 px-1.5 py-1 bg-white">
        <span className="text-[6px] font-semibold text-slate-600 bg-slate-100 rounded px-1 py-0.5">{t('serviceOutcall')}</span>
        <span className="text-[6px] font-semibold text-slate-600 bg-slate-100 rounded px-1 py-0.5">{t('serviceMassage')}</span>
        <span className="text-[6px] font-semibold text-violet-700 bg-violet-100 rounded px-1 py-0.5">{t('serviceMore')}</span>
      </div>
    </div>
  )
}

function BannerSlotWide({ previewUrl }: { previewUrl?: string }) {
  const t = useTranslations('components.bannerPreviewMock')
  return (
    <div className="relative rounded-xl overflow-hidden ring-2 ring-violet-500 shadow-[0_0_0_4px_rgba(139,92,246,0.3),0_10px_28px_-8px_rgba(139,92,246,0.5)] z-10">
      {previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="w-full aspect-[4/1] object-cover" />
          <div className="absolute top-1.5 left-1.5 bg-violet-600 text-white px-2 py-0.5 rounded-md text-[8px] font-extrabold flex items-center gap-1 shadow-lg backdrop-blur">
            <Megaphone className="w-2.5 h-2.5" />
            {t('bannerWideLabel')}
          </div>
        </>
      ) : (
        <div className="aspect-[4/1] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
          <div className="relative flex items-center gap-2 text-white">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold tracking-wide leading-none">{t('bannerWideLabel')}</p>
              <p className="text-[8px] opacity-90 mt-0.5">{t('bannerWideSubtitle')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BannerSlotCard({ previewUrl }: { previewUrl?: string }) {
  const t = useTranslations('components.bannerPreviewMock')
  return (
    <div className="relative rounded-lg overflow-hidden ring-2 ring-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.3),0_8px_24px_-6px_rgba(139,92,246,0.5)] aspect-[3/4] z-10">
      {previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute top-1 left-1 bg-violet-600 text-white px-1.5 py-0.5 rounded text-[7px] font-extrabold flex items-center gap-0.5 shadow">
            <Megaphone className="w-2 h-2" />
            {t('bannerCardLabel')}
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex flex-col items-center justify-center text-white p-2 relative">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <div className="relative w-6 h-6 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center mb-1">
            <Megaphone className="w-3 h-3" />
          </div>
          <p className="relative text-[9px] font-extrabold text-center leading-tight">{t('bannerCardTitle')}</p>
          <p className="relative text-[7px] opacity-90 mt-0.5 text-center">{t('bannerCardSubtitle')}</p>
          <div className="relative inline-flex items-center gap-0.5 mt-1 text-[6px] font-bold bg-white/20 rounded-full px-1.5 py-0.5">
            <Sparkles className="w-1.5 h-1.5" />
            {t('adBadge')}
          </div>
        </div>
      )}
    </div>
  )
}

function BannerSlotSidebar({ previewUrl }: { previewUrl?: string }) {
  const t = useTranslations('components.bannerPreviewMock')
  return (
    <div className="relative rounded-lg overflow-hidden ring-2 ring-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.3),0_8px_24px_-6px_rgba(139,92,246,0.5)] h-full min-h-[200px] z-10">
      {previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute top-1 left-1 right-1 bg-violet-600 text-white px-1 py-0.5 rounded text-[7px] font-extrabold flex items-center justify-center gap-0.5 shadow">
            <Megaphone className="w-2 h-2" />
            {t('bannerYoursLabel')}
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500 flex flex-col items-center justify-center text-white p-2 relative">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <div className="relative w-6 h-6 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center mb-1">
            <Megaphone className="w-3 h-3" />
          </div>
          <p className="relative text-[8px] font-extrabold text-center leading-tight px-1">{t('bannerLeftTitle')}</p>
          <p className="relative text-[6px] opacity-90 mt-1 text-center">{t('bannerLeftDesktopHint')}</p>
        </div>
      )}
    </div>
  )
}

function SiteHeader({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('components.bannerPreviewMock')
  const h = compact ? 'h-8' : 'h-10'
  return (
    <div className={`${h} bg-white border-b border-slate-200 flex items-center justify-between px-2.5 shrink-0 sticky top-0 z-10`}>
      <div className="flex items-center gap-1.5">
        {compact && <Menu className="w-3.5 h-3.5 text-slate-700" />}
        <span className={`font-black tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent ${compact ? 'text-[11px]' : 'text-sm'}`}>
          nicemodels
        </span>
      </div>
      {!compact && (
        <nav className="flex items-center gap-3 text-[9px] font-semibold text-slate-700">
          <span className="text-rose-600">{t('navHome')}</span>
          <span>{t('navGirls')}</span>
          <span>{t('navClubs')}</span>
          <span>{t('navJobsRent')}</span>
        </nav>
      )}
      <div className="flex items-center gap-1.5">
        <div className={`flex items-center gap-1 bg-slate-100 rounded-md px-1.5 py-1 ${compact ? 'w-16' : 'w-24'}`}>
          <Search className="w-2.5 h-2.5 text-slate-500 shrink-0" />
          <span className="text-[7px] text-slate-400 truncate">{t('searchPlaceholder')}</span>
        </div>
        {!compact && (
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-sm" />
        )}
      </div>
    </div>
  )
}

function Filters({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('components.bannerPreviewMock')
  const items = ['filterAll', 'filterZurich', 'filterGeneva', 'filterBasel', 'filterVerified'] as const

  return (
    <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white border-b border-slate-100 overflow-hidden shrink-0">
      {items.map((key, i) => (
        <span
          key={key}
          className={`shrink-0 rounded-full font-semibold border ${
            compact ? 'text-[7px] px-1.5 py-0.5' : 'text-[8px] px-2 py-0.5'
          } ${
            i === 0
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          {t(key)}
        </span>
      ))}
    </div>
  )
}

export default function HomeFeedMock({ mode, highlight, previewUrl, compact: compactProp = false }: HomeFeedMockProps) {
  const mobile = mode === 'mobile'
  const compact = compactProp
  const showSidebar = !mobile && highlight === 'banner-sidebar'
  const t = useTranslations('components.bannerPreviewMock')

  const cardSlice = compact ? 0 : 2
  const plainSlice = compact ? 2 : mobile ? 6 : 4

  if (mobile && highlight === 'banner-sidebar') {
    return (
      <div className="flex flex-col h-full min-h-0 bg-slate-50 w-full">
        <SiteHeader compact={mobile} />
        <Filters compact={mobile} />
        <div className={`flex-1 min-h-0 overflow-y-auto ${compact ? 'p-1.5' : 'p-2'}`}>
          <div className={`grid grid-cols-2 ${compact ? 'gap-1' : 'gap-1.5'}`}>
            {FAKE_MODELS.slice(0, plainSlice).map(m => (
              <ModelCardMock key={m.name} model={m} />
            ))}
          </div>
        </div>
        <MobileLeftBannerBottomPreview previewUrl={previewUrl} size="md" />
      </div>
    )
  }

  return (
    <div className="bg-slate-50 w-full">
      <SiteHeader compact={mobile} />
      <Filters compact={mobile} />

      <div className={`flex gap-2 ${compact ? 'p-1.5' : 'p-2'}`}>
        {showSidebar && (
          <div className="w-[90px] shrink-0">
            <BannerSlotSidebar previewUrl={previewUrl} />
          </div>
        )}

        <div className={`flex-1 min-w-0 ${compact ? 'space-y-1.5' : 'space-y-2'}`}>
          {highlight === 'banner-wide' && (
            <BannerSlotWide previewUrl={previewUrl} />
          )}

          <div className={`grid grid-cols-2 ${compact ? 'gap-1' : 'gap-1.5'}`}>
            {highlight === 'banner-card' ? (
              <>
                <ModelCardMock model={FAKE_MODELS[0]} />
                <BannerSlotCard previewUrl={previewUrl} />
                {FAKE_MODELS.slice(1, cardSlice + 1).map(m => (
                  <ModelCardMock key={m.name} model={m} />
                ))}
              </>
            ) : highlight === 'ad-card' ? (
              <>
                <ModelCardMock model={FAKE_MODELS[0]} />
                <ModelCardMock
                  model={{
                    name: t('youProfileName'),
                    city: t('youProfileCity'),
                    tone: 'from-violet-400 via-fuchsia-400 to-pink-400',
                    age: 24,
                  }}
                  highlighted
                  label={t('yourCardBadge')}
                />
                {FAKE_MODELS.slice(1, cardSlice + 1).map(m => (
                  <ModelCardMock key={m.name} model={m} />
                ))}
              </>
            ) : (
              FAKE_MODELS.slice(0, plainSlice).map(m => (
                <ModelCardMock key={m.name} model={m} />
              ))
            )}
          </div>

          {highlight === 'banner-wide' && !compact && (
            <div className="text-center">
              <p className="text-[8px] text-slate-400 font-semibold italic">
                {t('wideBannerRepeat')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
