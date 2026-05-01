import { createAdminClient } from '@/lib/supabase/admin'
import { EMAIL_FROM, EMAIL_REPLY_TO, getResendClient } from './client'
import { renderEmailHtml, renderEmailText, type LayoutData } from './layout'
import type { EmailKind } from './types'
import { KIND_TO_CATEGORY, NON_OPT_OUT_KINDS } from './types'
import { buildUnsubscribeUrl } from './unsubscribe'

interface SendEmailArgs {
  to: string
  subject: string
  kind: EmailKind
  recipientUserId?: string | null
  layout: Omit<LayoutData, 'unsubscribeUrl'>
  /** Plain-text body. If omitted we strip tags from `layout.bodyHtml`. */
  text?: string
  /** Force-send even if user is unsubscribed (rarely used). */
  force?: boolean
}

interface SendResult {
  ok: boolean
  skipped?: 'no_provider' | 'no_recipient' | 'unsubscribed' | 'invalid_email'
  id?: string
  error?: string
}

/**
 * Single point of egress for transactional emails.
 *
 * - Silent no-op when RESEND_API_KEY is missing (dev / pre-go-live).
 * - Honors `email_unsubscribes` rows unless `kind` is in NON_OPT_OUT_KINDS.
 * - Logs every attempt to `email_log` for audit (when table exists).
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendResult> {
  const { to, subject, kind, recipientUserId, layout, text, force } = args
  const trimmed = (to || '').trim().toLowerCase()
  if (!trimmed) return { ok: false, skipped: 'no_recipient' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, skipped: 'invalid_email' }
  }

  // Check unsubscribes (skip for mandatory kinds or when no user id known)
  if (!force && recipientUserId && !NON_OPT_OUT_KINDS.has(kind)) {
    const isOut = await isUnsubscribed(recipientUserId, kind)
    if (isOut) {
      await logEmail({
        recipient_user_id: recipientUserId,
        recipient_email: trimmed,
        kind,
        status: 'skipped_unsubscribed',
      })
      return { ok: false, skipped: 'unsubscribed' }
    }
  }

  const unsubscribeUrl = buildUnsubscribeUrl(recipientUserId, kind) ?? undefined
  const html = renderEmailHtml({ ...layout, unsubscribeUrl })
  const fallbackText = (layout.bodyHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const plain = renderEmailText(text ?? fallbackText, {
    ctaLabel: layout.ctaLabel,
    ctaUrl: layout.ctaUrl,
    unsubscribeUrl,
  })

  const client = getResendClient()
  if (!client) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info(`[email] would send "${kind}" to ${trimmed} (no RESEND_API_KEY)`)
    }
    await logEmail({
      recipient_user_id: recipientUserId ?? null,
      recipient_email: trimmed,
      kind,
      status: 'skipped_no_provider',
    })
    return { ok: false, skipped: 'no_provider' }
  }

  try {
    const { data, error } = await client.emails.send({
      from: EMAIL_FROM,
      to: trimmed,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
      text: plain,
      headers: unsubscribeUrl
        ? {
            // RFC 8058 one-click unsubscribe header (Gmail/Yahoo bulk-sender requirement).
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          }
        : undefined,
    })

    if (error) {
      await logEmail({
        recipient_user_id: recipientUserId ?? null,
        recipient_email: trimmed,
        kind,
        status: 'failed',
        error: error.message,
      })
      return { ok: false, error: error.message }
    }

    await logEmail({
      recipient_user_id: recipientUserId ?? null,
      recipient_email: trimmed,
      kind,
      status: 'sent',
      provider_id: data?.id ?? null,
    })
    return { ok: true, id: data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    await logEmail({
      recipient_user_id: recipientUserId ?? null,
      recipient_email: trimmed,
      kind,
      status: 'failed',
      error: msg,
    })
    return { ok: false, error: msg }
  }
}

async function isUnsubscribed(userId: string, kind: EmailKind): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const category = KIND_TO_CATEGORY[kind]
    const { data } = await admin
      .from('email_unsubscribes')
      .select('category')
      .eq('user_id', userId)
      .in('category', [category, 'all'])
      .limit(1)
    return !!data && data.length > 0
  } catch {
    return false
  }
}

async function logEmail(row: {
  recipient_user_id: string | null
  recipient_email: string
  kind: string
  status: string
  provider_id?: string | null
  error?: string | null
}) {
  try {
    const admin = createAdminClient()
    await admin.from('email_log').insert(row)
  } catch {
    // table may not exist yet — silent
  }
}
