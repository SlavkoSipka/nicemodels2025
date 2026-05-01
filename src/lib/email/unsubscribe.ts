import crypto from 'crypto'
import { APP_URL } from './client'
import type { EmailCategory, EmailKind } from './types'
import { KIND_TO_CATEGORY, NON_OPT_OUT_KINDS } from './types'

/**
 * Build a one-click unsubscribe URL signed with HMAC so the server can
 * verify it without the user being logged in.
 *
 * Format: /unsubscribe?u=<userId>&c=<category>&t=<issuedAt>&sig=<hmac>
 */
export function buildUnsubscribeUrl(
  userId: string | null | undefined,
  kind: EmailKind,
): string | null {
  if (!userId) return null
  if (NON_OPT_OUT_KINDS.has(kind)) return null

  const category: EmailCategory = KIND_TO_CATEGORY[kind]
  const t = Date.now().toString()
  const sig = signParams({ u: userId, c: category, t })

  const params = new URLSearchParams({ u: userId, c: category, t, sig })
  return `${APP_URL}/unsubscribe?${params.toString()}`
}

export function verifyUnsubscribeSignature(params: {
  u: string
  c: string
  t: string
  sig: string
}): boolean {
  const expected = signParams({ u: params.u, c: params.c, t: params.t })
  // constant-time compare
  const a = Buffer.from(expected)
  const b = Buffer.from(params.sig)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function signParams(p: { u: string; c: string; t: string }): string {
  const secret = getSecret()
  return crypto
    .createHmac('sha256', secret)
    .update(`${p.u}.${p.c}.${p.t}`)
    .digest('hex')
}

function getSecret(): string {
  // Order: dedicated secret > Supabase service role > NEXTAUTH_SECRET > fallback dev string.
  return (
    process.env.EMAIL_UNSUB_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'dev-only-do-not-use-in-prod'
  )
}
