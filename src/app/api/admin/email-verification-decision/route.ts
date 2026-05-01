import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendVerificationApprovedEmail,
  sendVerificationRejectedEmail,
} from '@/lib/email/templates'

/**
 * Send the verification-approved / verification-rejected email.
 * Admin-only. The decision itself is already persisted by the client;
 * this endpoint exists so we keep email keys + templating server-side.
 */
export async function POST(req: NextRequest) {
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

    const { userId, decision, reason } = await req.json()
    if (!userId || (decision !== 'approved' && decision !== 'rejected')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: target } = await admin
      .from('profiles')
      .select('email, username')
      .eq('id', userId)
      .single()

    if (!target?.email) {
      return NextResponse.json({ ok: true, skipped: 'no_email' })
    }

    const args = { email: target.email, userId, displayName: target.username }
    if (decision === 'approved') {
      await sendVerificationApprovedEmail(args)
    } else {
      await sendVerificationRejectedEmail({ ...args, reason: reason ?? null })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
