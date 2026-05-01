import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Insert an in-app notification visible in the user's NotificationBell.
 *
 * Used by admin update routes to inform users that an administrator
 * has changed something on their profile / listing / account.
 *
 * Silent on failure — admin actions must never break because of a
 * notification side-effect (e.g. table missing during local dev).
 */
export interface AdminNotifyArgs {
  userId: string
  type?: string
  title: string
  message: string
  actionUrl?: string | null
  relatedEntityType?: string | null
  relatedEntityId?: string | null
}

export async function notifyAdminAction(args: AdminNotifyArgs): Promise<void> {
  const {
    userId,
    type = 'admin_update',
    title,
    message,
    actionUrl = null,
    relatedEntityType = null,
    relatedEntityId = null,
  } = args
  if (!userId) return
  try {
    const admin = createAdminClient()
    await admin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      is_read: false,
      action_url: actionUrl,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
    })
  } catch {
    // Swallow — never block an admin action because of a side-effect.
  }
}

/**
 * Resolve the dashboard path that fits the recipient's role,
 * so the notification deep-links to the right place.
 */
export function dashboardPathForRole(
  role: string | null | undefined,
  section: 'profile' | 'jobs-rent' | 'verification' = 'profile',
): string {
  const base =
    role === 'model' ? '/dashboard/model'
    : role === 'company' ? '/dashboard/company'
    : '/dashboard/user'

  if (section === 'jobs-rent') {
    return role === 'company' ? '/dashboard/company/jobs-rent' : `${base}/jobs-rent`
  }
  if (section === 'verification') return `${base}/verification`
  if (role === 'company') return '/dashboard/company/profile/basic-info'
  return `${base}/profile`
}
