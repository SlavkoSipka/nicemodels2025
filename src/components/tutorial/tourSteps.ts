export type TourName = 'sedcard'

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
  /** Action to perform when "Next" is pressed (opens UI the next step needs). */
  onNext?: 'openMenu' | 'openProfile'
  /** Skip this step if its anchor is not in the DOM (e.g. already-active ad). */
  optional?: boolean
}

/** Ordered list of routes the tour walks through (one driver run per route). */
export const TOUR_ROUTES: Record<TourName, string[]> = {
  sedcard: ['/dashboard/model', '/dashboard/model/activate-ad'],
}

export const TOUR_STEPS: Record<TourName, TourStepDef[]> = {
  sedcard: [
    {
      route: '/dashboard/model',
      titleKey: 'welcomeTitle',
      descKey: 'welcomeDesc',
      side: 'over',
    },
    // Mobile only: the sidebar is a drawer -> open it first.
    {
      route: '/dashboard/model',
      element: '[data-tour="mobile-menu"]',
      titleKey: 'menuTitle',
      descKey: 'menuDesc',
      side: 'bottom',
      align: 'start',
      device: 'mobile',
      onNext: 'openMenu',
    },
    {
      route: '/dashboard/model',
      element: '[data-tour="nav-profile"]',
      titleKey: 'profileTitle',
      descKey: 'profileDesc',
      side: 'right',
      align: 'center',
      onNext: 'openProfile',
    },
    {
      route: '/dashboard/model',
      element: '[data-tour="profile-tabs"]',
      titleKey: 'profileTabsTitle',
      descKey: 'profileTabsDesc',
      side: 'right',
      align: 'center',
    },
    {
      route: '/dashboard/model',
      element: '[data-tour="nav-sedcard"]',
      titleKey: 'navSedcardTitle',
      descKey: 'navSedcardDesc',
      side: 'right',
      align: 'center',
    },
    {
      route: '/dashboard/model/activate-ad',
      element: '[data-tour="ad-info"]',
      titleKey: 'adInfoTitle',
      descKey: 'adInfoDesc',
      side: 'bottom',
      align: 'center',
    },
    {
      route: '/dashboard/model/activate-ad',
      element: '[data-tour="ad-preview"]',
      titleKey: 'adPreviewTitle',
      descKey: 'adPreviewDesc',
      side: 'top',
      align: 'center',
    },
    {
      route: '/dashboard/model/activate-ad',
      element: '[data-tour="ad-packages"]',
      titleKey: 'durationTitle',
      descKey: 'durationDesc',
      side: 'top',
      align: 'center',
      optional: true,
    },
  ],
}
