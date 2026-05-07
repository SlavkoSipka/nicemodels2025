import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Client-side Stripe.js loader (singleton). We don't need the bundled
 * Elements API for hosted Checkout; this is here for future Apple/Google
 * Pay redirects via `stripe.redirectToCheckout` if we ever need them.
 */
export function getStripeClient(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      stripePromise = Promise.resolve(null)
    } else {
      stripePromise = loadStripe(key)
    }
  }
  return stripePromise
}
