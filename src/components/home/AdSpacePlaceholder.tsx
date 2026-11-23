'use client'

import Link from 'next/link'
import { useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { Megaphone, X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

/**
 * "Your ad here" placeholders, one per banner placement, shown wherever a
 * slot is unsold so visitors and would-be advertisers can see that the space
 * exists. Each one uses the same frame as the real banner it stands in for,
 * so the layout keeps its shape whether the slot is sold or not, and a booked
 * banner simply replaces it.
 *
 *  - `AdSpacePlaceholder` (default): 2:3 side rail tile (`sidebar_left/right`, xl+)
 *  - `AdSpaceWide`: full-width 4:1 row between sedcards (`feed_wide`)
 *  - `AdSpaceCard`: one grid cell among the sedcards (`feed_card`)
 *  - `AdSpaceStrip`: slim bar pinned to the bottom of phones and tablets, where
 *    the side-rail banners are shown on small screens
 *
 * Models and clubs who are signed in can book a banner themselves, so they go
 * straight to their buy-banner page; everyone else goes to the contact form
 * with the advertising subject preselected.
 */
function useAdSpaceLink() {
  const { profile } = useAuth()
  if (profile?.role === 'model') return { href: '/dashboard/model/buy-banner', book: true }
  if (profile?.role === 'company') return { href: '/dashboard/company/buy-banner', book: true }
  return { href: '/contact?subject=advertising', book: false }
}

const BORDER = 'rgba(236,72,153,0.35)'
const FILL = 'rgba(255,255,255,0.55)'
const PINK = '#be185d'

function Icon({ className, iconClassName }: { className: string; iconClassName: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ${className}`} style={{ background: '#fce7f3' }}>
      <Megaphone className={iconClassName} style={{ color: PINK }} />
    </span>
  )
}

function Cta({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`shrink-0 rounded-lg font-semibold text-white transition-opacity group-hover:opacity-90 ${className}`}
      style={{ background: '#ec4899' }}
    >
      {children}
    </span>
  )
}

/** Side rail tile, same 2:3 frame as `BannerSidebarRail`. */
export default function AdSpacePlaceholder() {
  const t = useTranslations('home.adSpace')
  const { href, book } = useAdSpaceLink()

  return (
    <Link
      href={href}
      className="group flex w-full max-w-[240px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 text-center transition-colors"
      style={{ aspectRatio: '2/3', borderColor: BORDER, background: FILL }}
    >
      <Icon className="h-12 w-12" iconClassName="h-6 w-6" />
      <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: PINK }}>
        {t('label')}
      </span>
      <span className="text-lg font-bold leading-snug text-gray-900">{t('title')}</span>
      <span className="text-[13px] leading-relaxed text-gray-500">{t('text')}</span>
      <Cta className="mt-1 px-4 py-2 text-sm">{book ? t('ctaBook') : t('cta')}</Cta>
    </Link>
  )
}

/** Full-width row between sedcards, same 4:1 frame as `BannerCard`. */
export function AdSpaceWide() {
  const t = useTranslations('home.adSpace')
  const { href, book } = useAdSpaceLink()

  return (
    <Link href={href} className="group col-span-2 block w-full">
      <div
        className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-3 sm:gap-5 sm:px-8"
        style={{ aspectRatio: '4/1', borderColor: BORDER, background: FILL }}
      >
        <Icon className="h-9 w-9 sm:h-14 sm:w-14" iconClassName="h-4 w-4 sm:h-7 sm:w-7" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1">
          <span className="truncate text-[9px] font-bold uppercase tracking-[0.14em] sm:text-[11px]" style={{ color: PINK }}>
            {t('label')}
          </span>
          <span className="truncate text-sm font-bold leading-snug text-gray-900 sm:text-2xl">{t('title')}</span>
          <span className="hidden truncate text-[13px] text-gray-500 md:block">{t('text')}</span>
        </span>
        <Cta className="px-2.5 py-1.5 text-[11px] sm:px-5 sm:py-2.5 sm:text-sm">{book ? t('ctaBook') : t('cta')}</Cta>
      </div>
    </Link>
  )
}

/**
 * One grid cell among the sedcards. On phones it is the 3:4 frame of a card
 * photo; from `sm` up it stretches to the row height like `ModelCard`.
 */
export function AdSpaceCard() {
  const t = useTranslations('home.adSpace')
  const { href, book } = useAdSpaceLink()

  return (
    <Link href={href} className="group block w-full sm:h-full">
      <div
        className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-2 text-center sm:aspect-auto sm:h-full sm:min-h-[280px] sm:gap-3 sm:px-6"
        style={{ borderColor: BORDER, background: FILL }}
      >
        <Icon className="h-10 w-10 sm:h-12 sm:w-12" iconClassName="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px]" style={{ color: PINK }}>
          {t('label')}
        </span>
        <span className="text-sm font-bold leading-snug text-gray-900 sm:text-lg">{t('title')}</span>
        <span className="hidden text-[13px] leading-relaxed text-gray-500 sm:block">{t('text')}</span>
        <Cta className="mt-1 px-3 py-1.5 text-[11px] sm:px-4 sm:py-2 sm:text-sm">{book ? t('ctaBook') : t('cta')}</Cta>
      </div>
    </Link>
  )
}

const STRIP_DISMISS_KEY = 'nm:adSpaceStrip:dismissed'

const noSubscribe = () => () => {}
function readStripDismissed() {
  try {
    return sessionStorage.getItem(STRIP_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Phones and tablets have no side rails; a booked rail banner shows there in
 * the bottom promo strip (`MobileBannerPopup`). When none is booked this slim
 * bar holds that spot instead. It stays well under a third of the screen and
 * can be closed for the rest of the session.
 */
export function AdSpaceStrip() {
  const t = useTranslations('home.adSpace')
  const { href, book } = useAdSpaceLink()
  const { user } = useAuth()
  // Hidden on the server and during hydration, so both render the same; the
  // stored choice is read once the page is live.
  const storedDismissed = useSyncExternalStore(noSubscribe, readStripDismissed, () => true)
  const [dismissed, setDismissed] = useState(false)

  if (storedDismissed || dismissed) return null

  const dismiss = () => {
    try {
      sessionStorage.setItem(STRIP_DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      // Signed-in users have the round chat button in the bottom-right corner,
      // so the bar stops short of it instead of hiding its close button.
      className={`fixed bottom-2 left-2 z-40 xl:hidden ${user ? 'right-[88px]' : 'right-2'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="flex items-center gap-2 rounded-2xl border-2 border-dashed py-1.5 pl-2 pr-1.5"
        style={{
          borderColor: BORDER,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03)',
        }}
      >
        <Link href={href} className="group flex min-w-0 flex-1 items-center gap-2.5">
          <Icon className="h-9 w-9" iconClassName="h-4 w-4" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: PINK }}>
              {t('label')}
            </span>
            <span className="truncate text-sm font-bold leading-tight text-gray-900">{t('title')}</span>
          </span>
          <Cta className="px-2.5 py-1.5 text-[11px]">{book ? t('ctaBook') : t('cta')}</Cta>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('close')}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
