/**
 * Fail fast if required Stripe env vars are missing. Called at the top of
 * every Stripe-touching API handler so misconfigured deploys surface a
 * clear error instead of a generic 500 deep inside the SDK.
 */

const REQUIRED_VARS = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const

let liveKeyWarned = false

export function validateStripeEnv(): void {
  for (const name of REQUIRED_VARS) {
    if (!process.env[name]) {
      throw new Error(`Missing required Stripe env var: ${name}`)
    }
  }

  // Belt-and-suspenders: refuse to silently use a live secret key in dev.
  // We don't throw — that would block a developer who is intentionally
  // testing against live — but we surface a loud one-time warning.
  const secret = process.env.STRIPE_SECRET_KEY!
  if (
    secret.startsWith('sk_live_') &&
    process.env.NODE_ENV !== 'production' &&
    !liveKeyWarned
  ) {
    liveKeyWarned = true
    console.warn(
      '[stripe] WARNING: STRIPE_SECRET_KEY is a LIVE key but NODE_ENV is ' +
        `"${process.env.NODE_ENV}". Real charges will be made. Use sk_test_ ` +
        'for local development.',
    )
  }
}
