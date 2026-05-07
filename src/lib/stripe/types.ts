import type { BannerPlacement } from '@/lib/bannerPlacement'

/**
 * One unit a buyer is paying for in a single Checkout Session. The webhook
 * handler reads this back from order_items + side tables (banners,
 * job_listings) and flips them from pending_payment → active.
 */
export type CheckoutCartItem =
  | AdPackageCartItem
  | BannerCartItem
  | JobListingCartItem

export interface AdPackageCartItem {
  kind: 'ad_package'
  productId: string
  activationType: 'immediately' | 'after_current' | 'at_date'
  activationDate?: string | null
}

export interface BannerCartItem {
  kind: 'banner'
  productId: string
  /** ID of an already-inserted banners row in `pending_payment`. */
  bannerId: string
  placement: BannerPlacement
  /** Storage path inside the `banners` bucket (already uploaded). */
  imagePath: string
  ctaUrl: string | null
  targetCantons: string[]
  ownerType: 'model' | 'club'
  title: string
}

export interface JobListingCartItem {
  kind: 'job_listing'
  productId: string
  /** ID of an already-inserted job_listings row in `pending_payment`. */
  listingId: string
  activationType: 'immediately' | 'at_date'
  activationDate?: string | null
}

export interface CheckoutSessionRequestBody {
  items: CheckoutCartItem[]
  /** Path the user came from, used as both success and cancel return URL. */
  returnPath: string
}

export interface CheckoutSessionResponseBody {
  url: string
  orderId: string
}
