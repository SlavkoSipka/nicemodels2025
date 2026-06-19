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
  | 'admin_new_signup'
  // Verification (KYC)
  | 'verification_submitted'
  | 'verification_approved'
  | 'verification_rejected'
  // Engagement
  | 'welcome'
  | 'fav_digest'
  | 'saved_search_match'
  // Purchase (sedcard / ad lifecycle)
  | 'sedcard_expiring'
  | 'sedcard_expired'
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
  admin_new_signup:        'admin_actions',
  verification_submitted:  'verification',
  verification_approved:   'verification',
  verification_rejected:   'verification',
  welcome:                 'engagement',
  fav_digest:              'fav_digest',
  saved_search_match:      'saved_search_alerts',
  sedcard_expiring:        'purchase',
  sedcard_expired:         'purchase',
  report_received:         'reports',
  report_resolved:         'reports',
}

/** Categories that ALWAYS go through (cannot be unsubscribed). */
export const NON_OPT_OUT_KINDS: Set<EmailKind> = new Set([
  // Account-status changes are mandatory transactional.
  'admin_account_blocked',
  'admin_account_unblocked',
  'admin_account_deleted',
  // One-time welcome after registration.
  'welcome',
  // Internal notice to the NiceModels team — never carries an unsubscribe link.
  'admin_new_signup',
])

export interface BaseEmailData {
  recipientEmail: string
  recipientName?: string | null
  recipientUserId?: string | null
}
