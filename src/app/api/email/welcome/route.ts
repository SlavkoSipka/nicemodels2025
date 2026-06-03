import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email/templates'

export const runtime = 'nodejs'

/**
 * Sends the one-time welcome email after registration when onboarding opens.
 * Idempotent: skips if a welcome email was already logged for this user.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('email_log')
    .select('id')
    .eq('recipient_user_id', user.id)
    .eq('kind', 'welcome')
    .eq('status', 'sent')
    .limit(1)

  if (existing?.length) {
    return NextResponse.json({ ok: true, skipped: 'already_sent' })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('username, role, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.onboarding_completed) {
    return NextResponse.json({ ok: true, skipped: 'onboarding_complete' })
  }

  const role = profile.role as string | null
  if (role !== 'model' && role !== 'company') {
    return NextResponse.json({ ok: true, skipped: 'not_onboarding_role' })
  }

  const result = await sendWelcomeEmail({
    email: user.email,
    userId: user.id,
    displayName: profile.username,
  })

  if (!result.ok && result.skipped !== 'no_provider') {
    return NextResponse.json(
      { ok: false, error: result.error || result.skipped || 'send_failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, sent: result.ok, skipped: result.skipped })
}
