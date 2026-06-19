export type TourName = 'sedcard' | 'banner'

export type TourSide = 'top' | 'bottom' | 'left' | 'right' | 'over'
export type TourAlign = 'start' | 'center' | 'end'

export interface TourStepDef {
  /** Pathname this step belongs to. A tour is split into per-route segments. */
  route: string
  /** CSS selector to anchor on. Omit for a centered modal step. */
  element?: string
  titleKey: string
  descKey: string
  side?: TourSide
  align?: TourAlign
  /** Restrict a step to one viewport (e.g. the mobile hamburger). */
  device?: 'mobile' | 'desktop'
}

/** Ordered list of routes each tour walks through (one driver run per route). */
export const TOUR_ROUTES: Record<TourName, string[]> = {
  sedcard: ['/dashboard/model', '/dashboard/model/activate-ad'],
  banner: ['/dashboard/model/buy-banner'],
}

export const TOUR_STEPS: Record<TourName, TourStepDef[]> = {
  sedcard: [
    {
      route: '/dashboard/model',
      titleKey: 'welcomeTitle',
      descKey: 'welcomeDesc',
      side: 'over',
    },
    // Desktop: the sidebar is always visible -> point straight at the link.
    {
      route: '/dashboard/model',
      element: '[data-tour="nav-sedcard"]',
      titleKey: 'navSedcardTitle',
      descKey: 'navSedcardDesc',
      side: 'right',
      align: 'center',
      device: 'desktop',
    },
    // Mobile: the sidebar is a drawer -> point at the hamburger first.
    {
      route: '/dashboard/model',
      element: '[data-tour="mobile-menu"]',
      titleKey: 'menuTitle',
      descKey: 'menuDesc',
      side: 'bottom',
      align: 'start',
      device: 'mobile',
    },
    {
      route: '/dashboard/model/activate-ad',
      element: '[data-tour="ad-packages"]',
      titleKey: 'pkgTitle',
      descKey: 'pkgDesc',
      side: 'top',
      align: 'center',
    },
    {
      route: '/dashboard/model/activate-ad',
      element: '[data-tour="ad-activation"]',
      titleKey: 'activationTitle',
      descKey: 'activationDesc',
      side: 'top',
    },
    {
      route: '/dashboard/model/activate-ad',
      element: '[data-tour="ad-add-to-cart"]',
      titleKey: 'addCartTitle',
      descKey: 'addCartDesc',
      side: 'top',
    },
    {
      route: '/dashboard/model/activate-ad',
      element: '[data-tour="ad-cart"]',
      titleKey: 'cartTitle',
      descKey: 'cartDesc',
      side: 'top',
    },
    {
      route: '/dashboard/model/activate-ad',
      element: '[data-tour="ad-terms"]',
      titleKey: 'termsTitle',
      descKey: 'termsDesc',
      side: 'top',
    },
    {
      route: '/dashboard/model/activate-ad',
      element: '[data-tour="ad-pay"]',
      titleKey: 'payTitle',
      descKey: 'payDesc',
      side: 'top',
    },
    {
      route: '/dashboard/model/activate-ad',
      titleKey: 'sedcardDoneTitle',
      descKey: 'sedcardDoneDesc',
      side: 'over',
    },
  ],
  banner: [
    {
      route: '/dashboard/model/buy-banner',
      titleKey: 'bannerIntroTitle',
      descKey: 'bannerIntroDesc',
      side: 'over',
    },
    {
      route: '/dashboard/model/buy-banner',
      element: '[data-tour="banner-placement"]',
      titleKey: 'bannerPlacementTitle',
      descKey: 'bannerPlacementDesc',
      side: 'top',
    },
    {
      route: '/dashboard/model/buy-banner',
      element: '[data-tour="banner-regions"]',
      titleKey: 'bannerRegionsTitle',
      descKey: 'bannerRegionsDesc',
      side: 'top',
    },
    {
      route: '/dashboard/model/buy-banner',
      element: '[data-tour="banner-duration"]',
      titleKey: 'bannerDurationTitle',
      descKey: 'bannerDurationDesc',
      side: 'top',
    },
    {
      route: '/dashboard/model/buy-banner',
      element: '[data-tour="banner-upload"]',
      titleKey: 'bannerUploadTitle',
      descKey: 'bannerUploadDesc',
      side: 'top',
    },
    {
      route: '/dashboard/model/buy-banner',
      element: '[data-tour="banner-confirm"]',
      titleKey: 'bannerConfirmTitle',
      descKey: 'bannerConfirmDesc',
      side: 'top',
    },
    {
      route: '/dashboard/model/buy-banner',
      titleKey: 'bannerDoneTitle',
      descKey: 'bannerDoneDesc',
      side: 'over',
    },
  ],
}
