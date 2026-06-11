import { APP_URL, SUPPORT_EMAIL } from './client'
import { sendEmail } from './sendEmail'

interface BaseRecipient {
  email: string
  userId: string | null | undefined
  displayName: string | null | undefined
}

// ---------- Admin actions -----------------------------------------------------

export function sendAccountBlockedEmail(opts: BaseRecipient & { reason?: string | null }) {
  const name = opts.displayName || 'there'
  const reasonHtml = opts.reason
    ? `<p style="margin:12px 0 0;padding:10px 12px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;color:#991b1b;font-size:13px;">
        <strong>Reason:</strong> ${escape(opts.reason)}
      </p>`
    : ''
  return sendEmail({
    to: opts.email,
    subject: 'Your NiceModels account has been blocked',
    kind: 'admin_account_blocked',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: 'Your account has been blocked',
      preheader: 'An administrator has blocked your NiceModels account.',
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>Our team has blocked your account on NiceModels.ch. While blocked, your profile, listings and messages are no longer visible to other users.</p>
        ${reasonHtml}
        <p style="margin-top:14px;">If you think this is a mistake, please reach out to us so we can review the case.</p>
      `,
      ctaLabel: 'Contact support',
      ctaUrl: `mailto:${SUPPORT_EMAIL}`,
      footerNote: 'You receive this because you have a NiceModels account. This is a mandatory account-status notice.',
    },
  })
}

export function sendAccountUnblockedEmail(opts: BaseRecipient) {
  const name = opts.displayName || 'there'
  return sendEmail({
    to: opts.email,
    subject: 'Your NiceModels account is active again',
    kind: 'admin_account_unblocked',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: 'Your account is active again',
      preheader: 'Your NiceModels account has been unblocked.',
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>Good news — your account on NiceModels.ch has been reactivated. You can sign in and use the platform as usual.</p>
      `,
      ctaLabel: 'Open my dashboard',
      ctaUrl: `${APP_URL}/login`,
    },
  })
}

export function sendAccountDeletedEmail(opts: BaseRecipient & { byAdmin: boolean }) {
  const name = opts.displayName || 'there'
  const intro = opts.byAdmin
    ? 'Your account on NiceModels.ch has been removed by an administrator.'
    : 'Your account on NiceModels.ch has been deleted as you requested.'
  return sendEmail({
    to: opts.email,
    subject: 'Your NiceModels account has been deleted',
    kind: 'admin_account_deleted',
    recipientUserId: null, // user no longer exists; this is the goodbye email
    layout: {
      title: 'Account deleted',
      preheader: intro,
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>${escape(intro)}</p>
        <p>All your profile data, photos, listings and messages have been removed. Your email is now free to register again in the future.</p>
        <p>If you have any questions, write to us anytime at <a href="mailto:${SUPPORT_EMAIL}" style="color:#ec4899;">${SUPPORT_EMAIL}</a>.</p>
      `,
    },
  })
}

export function sendListingBlockedEmail(opts: BaseRecipient & { listingTitle: string; listingType: 'job' | 'rent'; reason?: string | null }) {
  const name = opts.displayName || 'there'
  const typeLabel = opts.listingType === 'rent' ? 'Rent listing' : 'Job listing'
  const reasonHtml = opts.reason
    ? `<p style="margin:12px 0 0;padding:10px 12px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;color:#991b1b;font-size:13px;">
        <strong>Reason:</strong> ${escape(opts.reason)}
      </p>`
    : ''
  return sendEmail({
    to: opts.email,
    subject: `Your ${typeLabel.toLowerCase()} has been hidden`,
    kind: 'admin_listing_blocked',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: `${typeLabel} hidden`,
      preheader: `Your listing "${opts.listingTitle}" was hidden by an administrator.`,
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>Your ${typeLabel.toLowerCase()} <strong>${escape(opts.listingTitle)}</strong> has been hidden from public view by our team.</p>
        ${reasonHtml}
        <p style="margin-top:14px;">You can still see it in your dashboard. Update or remove the listing, or contact us if you think this is a mistake.</p>
      `,
      ctaLabel: 'Open my listings',
      ctaUrl: `${APP_URL}/dashboard/company/jobs-rent`,
    },
  })
}

export function sendListingUnblockedEmail(opts: BaseRecipient & { listingTitle: string; listingType: 'job' | 'rent' }) {
  const name = opts.displayName || 'there'
  const typeLabel = opts.listingType === 'rent' ? 'Rent listing' : 'Job listing'
  return sendEmail({
    to: opts.email,
    subject: `Your ${typeLabel.toLowerCase()} is visible again`,
    kind: 'admin_listing_unblocked',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: `${typeLabel} restored`,
      preheader: `Your listing "${opts.listingTitle}" is public again.`,
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>Your ${typeLabel.toLowerCase()} <strong>${escape(opts.listingTitle)}</strong> is now visible to everyone again.</p>
      `,
      ctaLabel: 'View listings',
      ctaUrl: `${APP_URL}/jobs-rents`,
    },
  })
}

/**
 * Free-form message from an administrator to a single user.
 * `subject` and `body` come from the admin in the dashboard.
 * `body` is plain text; we wrap it in a styled paragraph block.
 */
export function sendAdminCustomMessageEmail(opts: BaseRecipient & {
  subject: string
  body: string
}) {
  const name = opts.displayName || 'there'
  const safeSubject = (opts.subject || '').trim() || 'A message from NiceModels'
  const safeBody = (opts.body || '').trim()
  const paragraphs = safeBody
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 12px 0;line-height:1.55;">${escape(p).replace(/\n/g, '<br />')}</p>`)
    .join('')

  return sendEmail({
    to: opts.email,
    subject: safeSubject,
    kind: 'admin_custom_message',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: safeSubject,
      preheader: safeBody.slice(0, 120),
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        ${paragraphs}
        <p style="margin-top:14px;color:#64748b;font-size:13px;">— The NiceModels team</p>
      `,
      ctaLabel: 'Open my dashboard',
      ctaUrl: `${APP_URL}/login`,
    },
  })
}

// ---------- Verification (KYC) -----------------------------------------------

export function sendVerificationApprovedEmail(opts: BaseRecipient) {
  const name = opts.displayName || 'there'
  return sendEmail({
    to: opts.email,
    subject: 'You are now verified on NiceModels',
    kind: 'verification_approved',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: 'Verification approved',
      preheader: 'Your identity has been verified — your profile now shows the verified badge.',
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>Great news — your verification has been approved. Your profile now shows the verified badge to other users.</p>
      `,
      ctaLabel: 'Open dashboard',
      ctaUrl: `${APP_URL}/login`,
    },
  })
}

export function sendVerificationRejectedEmail(opts: BaseRecipient & { reason?: string | null }) {
  const name = opts.displayName || 'there'
  const reasonHtml = opts.reason
    ? `<p style="margin:12px 0 0;padding:10px 12px;background:#fef9c3;border-left:3px solid #facc15;border-radius:4px;color:#854d0e;font-size:13px;">
        <strong>Reason:</strong> ${escape(opts.reason)}
      </p>`
    : ''
  return sendEmail({
    to: opts.email,
    subject: 'Your verification needs another look',
    kind: 'verification_rejected',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: 'Verification was not approved',
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>We could not approve your verification on this attempt. You can submit again from your dashboard.</p>
        ${reasonHtml}
      `,
      ctaLabel: 'Try again',
      ctaUrl: `${APP_URL}/login`,
    },
  })
}

// ---------- Welcome (registration) --------------------------------------------

export function sendWelcomeEmail(opts: BaseRecipient) {
  const name = opts.displayName || 'there'
  return sendEmail({
    to: opts.email,
    subject: 'Welcome to NiceModels',
    kind: 'welcome',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: 'Welcome to NiceModels',
      preheader: 'Thanks for joining NiceModels.ch — complete your profile to get started.',
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>Welcome to <strong>NiceModels.ch</strong> — we're glad you're here.</p>
        <p>Your account is ready. Complete your profile on the onboarding page to start using the platform.</p>
        <p style="margin-top:14px;color:#64748b;font-size:13px;">If you have any questions, our team is happy to help.</p>
      `,
      ctaLabel: 'Continue setup',
      ctaUrl: `${APP_URL}/onboarding`,
    },
  })
}

// ---------- Favorites digest -------------------------------------------------

export interface FavDigestItem {
  modelId: string
  modelName: string
  events: Array<{ kind: 'photo' | 'story' | 'location' | 'online'; description: string }>
}

export function sendFavDigestEmail(opts: BaseRecipient & { items: FavDigestItem[] }) {
  if (!opts.items.length) return Promise.resolve({ ok: false, skipped: 'no_recipient' as const })
  const name = opts.displayName || 'there'
  const list = opts.items
    .map(it => {
      const evts = it.events
        .map(e => `<li style="margin:2px 0;color:#475569;">${escape(eventLabel(e))}</li>`)
        .join('')
      return `<div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
        <a href="${APP_URL}/models/${escape(it.modelId)}" style="font-weight:600;color:#1a1a2e;text-decoration:none;">${escape(it.modelName)}</a>
        <ul style="margin:4px 0 0 16px;padding:0;font-size:13px;list-style:disc;">${evts}</ul>
      </div>`
    })
    .join('')

  const total = opts.items.reduce((acc, it) => acc + it.events.length, 0)
  return sendEmail({
    to: opts.email,
    subject: `${total} new update${total === 1 ? '' : 's'} from your favorites`,
    kind: 'fav_digest',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: 'Updates from your favorites',
      preheader: `${total} new update${total === 1 ? '' : 's'} in the last 24 hours`,
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>Here is what is new from the models you favorited:</p>
        <div style="margin:12px 0;">${list}</div>
      `,
      ctaLabel: 'Open my favorites',
      ctaUrl: `${APP_URL}/dashboard/user/favorites`,
    },
  })
}

function eventLabel(e: FavDigestItem['events'][number]): string {
  return e.description
}

// ---------- Sedcard / ad lifecycle -------------------------------------------

/**
 * Reminder sent ~24h before a model's sedcard (ad package) expires.
 * `expiryLabel` is a human-readable, localized date string.
 */
export function sendSedcardExpiringEmail(opts: BaseRecipient & { expiryLabel: string }) {
  const name = opts.displayName || 'there'
  return sendEmail({
    to: opts.email,
    subject: 'Your NiceModels sedcard expires in 24 hours',
    kind: 'sedcard_expiring',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: 'Your sedcard expires soon',
      preheader: `Your ad goes offline on ${opts.expiryLabel}. Renew now to stay visible.`,
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>Your sedcard (advertisement) on NiceModels.ch is about to expire.</p>
        <p style="margin:12px 0;padding:10px 12px;background:#fef9c3;border-left:3px solid #facc15;border-radius:4px;color:#854d0e;font-size:13px;">
          <strong>Expires:</strong> ${escape(opts.expiryLabel)}
        </p>
        <p>To keep your profile visible to visitors without interruption, renew your sedcard before it expires.</p>
      `,
      ctaLabel: 'Renew my sedcard',
      ctaUrl: `${APP_URL}/dashboard/model/activate-ad`,
    },
  })
}

/**
 * Sent once after a model's sedcard (ad package) has expired and they no
 * longer have an active ad.
 */
export function sendSedcardExpiredEmail(opts: BaseRecipient & { expiryLabel: string }) {
  const name = opts.displayName || 'there'
  return sendEmail({
    to: opts.email,
    subject: 'Your NiceModels sedcard has expired',
    kind: 'sedcard_expired',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: 'Your sedcard has expired',
      preheader: 'Your profile is no longer visible to visitors. Reactivate it anytime.',
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>Your sedcard (advertisement) on NiceModels.ch expired on <strong>${escape(opts.expiryLabel)}</strong>.</p>
        <p>Your profile is no longer shown to visitors. You can reactivate it anytime — it only takes a minute and your profile details stay saved.</p>
      `,
      ctaLabel: 'Reactivate my sedcard',
      ctaUrl: `${APP_URL}/dashboard/model/activate-ad`,
    },
  })
}

// ---------- Reports ----------------------------------------------------------

/**
 * Notify the admin team that a new report has been submitted.
 * `recipientUserId` is null because we send to a shared support inbox, not a user.
 */
export function sendReportReceivedEmail(opts: {
  to: string
  reporterName: string
  reportedName: string
  reason?: string | null
  reportId: string
}) {
  const reasonBlock = opts.reason
    ? `<p style="margin:12px 0 0;padding:10px 12px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;color:#991b1b;font-size:13px;">
         <strong>Reason:</strong> ${escape(opts.reason)}
       </p>`
    : '<p style="margin:12px 0 0;color:#94a3b8;font-size:12px;font-style:italic;">No reason provided.</p>'
  return sendEmail({
    to: opts.to,
    subject: `New report: ${opts.reporterName} → ${opts.reportedName}`,
    kind: 'report_received',
    recipientUserId: null,
    force: true, // mandatory operational alert for the admin team
    layout: {
      title: 'New user report',
      preheader: `${opts.reporterName} reported ${opts.reportedName}`,
      bodyHtml: `
        <p>A new report has just been submitted on NiceModels.ch.</p>
        <p style="margin:10px 0 0;">
          <strong>Reporter:</strong> ${escape(opts.reporterName)}<br />
          <strong>Reported:</strong> ${escape(opts.reportedName)}<br />
          <strong>Report ID:</strong> <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px;">${escape(opts.reportId)}</code>
        </p>
        ${reasonBlock}
      `,
      ctaLabel: 'Open admin dashboard',
      ctaUrl: `${APP_URL}/dashboard/admin/reports`,
      footerNote: 'You receive this because you are an administrator on NiceModels.ch.',
    },
  })
}

/**
 * Notify the user who submitted a report that their report has been resolved.
 */
export function sendReportResolvedEmail(opts: {
  email: string
  userId: string | null | undefined
  displayName: string | null | undefined
  status: 'reviewed' | 'dismissed'
}) {
  const name = opts.displayName || 'there'
  const intro = opts.status === 'reviewed'
    ? 'Thanks for taking the time to report this. Our team has reviewed your submission and taken appropriate action.'
    : 'Thanks for taking the time to report this. After review, our team determined that no action is needed.'
  return sendEmail({
    to: opts.email,
    subject: opts.status === 'reviewed' ? 'Your report has been reviewed' : 'Your report was dismissed',
    kind: 'report_resolved',
    recipientUserId: opts.userId ?? null,
    layout: {
      title: opts.status === 'reviewed' ? 'Report reviewed' : 'Report dismissed',
      preheader: 'Your report on NiceModels.ch has been resolved.',
      bodyHtml: `
        <p>Hi ${escape(name)},</p>
        <p>${escape(intro)}</p>
        <p style="margin-top:12px;">If you encounter further issues, please don't hesitate to reach out — every report helps keep the community safe.</p>
      `,
      ctaLabel: 'Open my account',
      ctaUrl: `${APP_URL}/login`,
    },
  })
}

// ---------- helpers ----------------------------------------------------------

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
