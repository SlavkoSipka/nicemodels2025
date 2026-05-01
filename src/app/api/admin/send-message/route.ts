import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAdminCustomMessageEmail } from '@/lib/email/templates'
import { dashboardPathForRole, notifyAdminAction } from '@/lib/admin/notify'

/**
 * Admin-only endpoint that sends a free-form message to a single user.
 *
 * - Always inserts an in-app notification (so the recipient sees it
 *   in their NotificationBell even if email is opted out / fails).
 * - Optionally also sends an email when `sendEmail: true` (default).
 *
 * Body:
 *   { userId: string, subject: string, body: string, sendEmail?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: caller } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, subject, body, sendEmail = true } = await request.json()

    if (!userId || !subject?.trim() || !body?.trim()) {
      return NextResponse.json(
        { error: 'userId, subject and body are required' },
        { status: 400 },
      )
    }

    const admin = createAdminClient()
    const { data: target } = await admin
      .from('profiles')
      .select('email, username, role')
      .eq('id', userId)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await notifyAdminAction({
      userId,
      type: 'admin_message',
      title: subject.trim().slice(0, 120),
      message: body.trim().slice(0, 500),
      actionUrl: dashboardPathForRole(target.role, 'profile'),
    })

    let emailResult: { ok: boolean; skipped?: string; error?: string } = { ok: false, skipped: 'not_requested' }
    if (sendEmail && target.email) {
      emailResult = await sendAdminCustomMessageEmail({
        email: target.email,
        userId,
        displayName: target.username,
        subject: subject.trim(),
        body: body.trim(),
      })
    }

    return NextResponse.json({ success: true, email: emailResult })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Server error' },
      { status: 500 },
    )
  }
}
