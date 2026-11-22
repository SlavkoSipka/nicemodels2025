import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdminAction } from '@/lib/admin/notify'
import { sendAccountTypeChangedEmail } from '@/lib/email/templates'

export const runtime = 'nodejs'

type AssignableRole = 'user' | 'model' | 'company'

function isAssignable(v: unknown): v is AssignableRole {
  return v === 'user' || v === 'model' || v === 'company'
}

/**
 * Admin: change the account type of a non-admin account, e.g. a model who
 * registered as a visitor.
 *
 * Model and club accounts are sent back through onboarding on their next
 * visit. Data from the previous type is kept, so switching back restores it.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { userId, newRole } = await request.json()
    if (!userId || !isAssignable(newRole)) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }
    if (userId === user.id) {
      return NextResponse.json({ error: 'You cannot change your own account type' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: target } = await admin
      .from('profiles')
      .select('id, email, username, role')
      .eq('id', userId)
      .maybeSingle()
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    // Admin accounts are never converted here: demoting one is a security change.
    if (target.role === 'admin') {
      return NextResponse.json({ error: 'Admin accounts cannot be changed here' }, { status: 400 })
    }
    if (target.role === newRole) {
      return NextResponse.json({ error: 'The account already has this type' }, { status: 400 })
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update({ role: newRole, onboarding_completed: newRole === 'user' })
      .eq('id', userId)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Keep the signup metadata in line so code reading it sees the new type.
    const { data: authUser } = await admin.auth.admin.getUserById(userId)
    if (authUser?.user) {
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { ...(authUser.user.user_metadata ?? {}), role: newRole },
      })
    }

    const needsSetup = newRole !== 'user'
    await notifyAdminAction({
      userId,
      title: 'Your account type has been changed',
      message: needsSetup
        ? 'An administrator changed your account type. Please complete your new profile.'
        : 'An administrator changed your account to a visitor account.',
      actionUrl: needsSetup ? '/onboarding' : '/dashboard',
      relatedEntityType: 'account_type',
      relatedEntityId: userId,
    })

    if (target.email) {
      sendAccountTypeChangedEmail({
        email: target.email,
        userId,
        displayName: target.username,
        newRole,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, previousRole: target.role, newRole })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
