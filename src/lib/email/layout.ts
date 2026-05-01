import { APP_URL, SUPPORT_EMAIL } from './client'

/**
 * Base HTML layout used by every transactional email.
 * Inline CSS only (Gmail/Outlook ignore <style>).
 */
export interface LayoutData {
  title: string
  preheader?: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
  unsubscribeUrl?: string
}

const PINK = '#ec4899'
const SLATE_900 = '#1a1a2e'
const SLATE_500 = '#64748b'
const SLATE_300 = '#cbd5e1'
const BG = '#fce9f3'

export function renderEmailHtml({
  title,
  preheader = '',
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerNote,
  unsubscribeUrl,
}: LayoutData): string {
  const cta =
    ctaLabel && ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:8px;background:${PINK};">
          <a href="${escapeAttr(ctaUrl)}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-weight:600;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:14px;letter-spacing:0.02em;">${escapeHtml(ctaLabel)}</a>
        </td></tr></table>`
      : ''

  const unsub = unsubscribeUrl
    ? `<p style="margin:18px 0 0;font-size:11px;color:${SLATE_300};font-family:Inter,Arial,sans-serif;">
        You receive this email because you have an account at NiceModels.ch.
        <a href="${escapeAttr(unsubscribeUrl)}" style="color:${SLATE_500};text-decoration:underline;">Unsubscribe from these emails</a>.
      </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BG};font-family:Inter,-apple-system,BlinkMacSystemFont,Arial,sans-serif;color:${SLATE_900};">
    <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</span>
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${APP_URL}" style="display:inline-block;text-decoration:none;">
          <img src="${APP_URL}/logo.webp" alt="NiceModels.ch" width="160" style="height:auto;display:block;margin:0 auto;" />
        </a>
      </div>
      <div style="background:#ffffff;border-radius:14px;padding:28px 24px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 2px 12px rgba(0,0,0,0.05);">
        <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:${SLATE_900};font-family:'Playfair Display',Georgia,serif;">
          ${escapeHtml(title)}
        </h1>
        <div style="font-size:14px;line-height:1.6;color:${SLATE_900};">
          ${bodyHtml}
        </div>
        ${cta}
        ${footerNote ? `<p style="margin:24px 0 0;font-size:12px;color:${SLATE_500};">${footerNote}</p>` : ''}
      </div>
      <div style="text-align:center;margin-top:18px;">
        <p style="margin:0;font-size:11px;color:${SLATE_500};">
          Need help? Email <a href="mailto:${SUPPORT_EMAIL}" style="color:${PINK};text-decoration:none;">${SUPPORT_EMAIL}</a>
        </p>
        ${unsub}
      </div>
    </div>
  </body>
</html>`
}

export function renderEmailText(plain: string, opts?: { ctaLabel?: string; ctaUrl?: string; unsubscribeUrl?: string }): string {
  const lines: string[] = [plain]
  if (opts?.ctaLabel && opts.ctaUrl) {
    lines.push('', `${opts.ctaLabel}: ${opts.ctaUrl}`)
  }
  lines.push('', '---', `NiceModels.ch — ${SUPPORT_EMAIL}`)
  if (opts?.unsubscribeUrl) {
    lines.push('', `Unsubscribe: ${opts.unsubscribeUrl}`)
  }
  return lines.join('\n')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}
