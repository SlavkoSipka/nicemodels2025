import Stripe from 'stripe'

let _stripe: Stripe | null = null

/**
 * Server-side Stripe client. Lazy-initialised so server components that don't
 * touch payments don't trigger the env-var check.
 *
 * STRIPE_SECRET_KEY: sk_test_... or sk_live_...
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  _stripe = new Stripe(key, {
    // Pin a recent API version so behaviour doesn't shift unexpectedly when
    // Stripe rolls breaking changes. Update consciously. The any-cast avoids
    // depending on Stripe.LatestApiVersion which isn't always exported by
    // the installed SDK version.
    apiVersion: '2026-04-22.dahlia' as any,
    typescript: true,
    appInfo: {
      name: 'nicemodels.ch',
    },
  })
  return _stripe
}
