/** Stable per-category keys used in `email_unsubscribes`. */
export type EmailCategory =
  | 'admin_actions'
  | 'verification'
  | 'purchase'
  | 'engagement'
  | 'fav_digest'
  | 'saved_search_alerts'
  | 'reports'
  | 'all'

/** All known transactional emails. Keep stable for analytics + unsubscribe. */
export type EmailKind =
  // Admin actions
  | 'admin_account_blocked'
  | 'admin_account_unblocked'
  | 'admin_account_deleted'
  | 'admin_listing_blocked'
  | 'admin_listing_unblocked'
  | 'admin_custom_message'
  // Verification (KYC)
  | 'verification_submitted'
  | 'verification_approved'
  | 'verification_rejected'
  // Engagement
  | 'fav_digest'
  | 'saved_search_match'
  // Reports
  | 'report_received'
  | 'report_resolved'

/** Map a kind to a user-facing preference category for unsubscribe. */
export const KIND_TO_CATEGORY: Record<EmailKind, EmailCategory> = {
  admin_account_blocked:   'admin_actions',
  admin_account_unblocked: 'admin_actions',
  admin_account_deleted:   'admin_actions',
  admin_listing_blocked:   'admin_actions',
  admin_listing_unblocked: 'admin_actions',
  admin_custom_message:    'admin_actions',
  verification_submitted:  'verification',
  verification_approved:   'verification',
  verification_rejected:   'verification',
  fav_digest:              'fav_digest',
  saved_search_match:      'saved_search_alerts',
  report_received:         'reports',
  report_resolved:         'reports',
}

/** Categories that ALWAYS go through (cannot be unsubscribed). */
export const NON_OPT_OUT_KINDS: Set<EmailKind> = new Set([
  // Account-status changes are mandatory transactional.
  'admin_account_blocked',
  'admin_account_unblocked',
  'admin_account_deleted',
])

export interface BaseEmailData {
  recipientEmail: string
  recipientName?: string | null
  recipientUserId?: string | null
}
