import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewSignupAdminEmail } from '@/lib/email/templates'

export const runtime = 'nodejs'

/**
 * Notifies the NiceModels team when a new account is created. Called right
 * after sign-up. Idempotent: skips if an admin notice was already logged for
 * this user.
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
    .eq('kind', 'admin_new_signup')
    .eq('status', 'sent')
    .limit(1)

  if (existing?.length) {
    return NextResponse.json({ ok: true, skipped: 'already_sent' })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('username, role, phone, date_of_birth')
    .eq('id', user.id)
    .maybeSingle()

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>

  const result = await sendNewSignupAdminEmail({
    newUserId: user.id,
    email: user.email,
    username: profile?.username ?? (meta.username as string | undefined) ?? null,
    role: profile?.role ?? (meta.role as string | undefined) ?? null,
    phone: profile?.phone ?? (meta.phone as string | undefined) ?? null,
    dateOfBirth:
      profile?.date_of_birth ?? (meta.date_of_birth as string | undefined) ?? null,
  })

  if (!result.ok && result.skipped !== 'no_provider') {
    return NextResponse.json(
      { ok: false, error: result.error || result.skipped || 'send_failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, sent: result.ok, skipped: result.skipped })
}
