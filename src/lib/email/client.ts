import { Resend } from 'resend'

/**
 * Lazy-initialized Resend client. We never throw at import time:
 * if the key is missing the wrapper logs and silently no-ops, so the
 * site keeps working in dev / before go-live.
 */
let cached: Resend | null = null

export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!cached) cached = new Resend(key)
  return cached
}

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? 'NiceModels <noreply@nicemodels.ch>'

export const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO ?? 'info@nicemodels.ch'

export const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nicemodels.ch'

export const SUPPORT_EMAIL = 'info@nicemodels.ch'
