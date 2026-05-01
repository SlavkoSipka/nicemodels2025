import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendVerificationApprovedEmail,
  sendVerificationRejectedEmail,
} from '@/lib/email/templates'

export const runtime = 'nodejs'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin' ? user : null
}

/**
 * GET — list all verifications with profile info.
 * Service-role bypass keeps this independent of RLS.
 */
export async function GET() {
  const reviewer = await verifyAdmin()
  if (!reviewer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: verifications, error } = await admin
    .from('verifications')
    .select('*')
    .order('submitted_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const list = verifications || []
  if (list.length === 0) {
    return NextResponse.json({ verifications: [] })
  }

  const userIds = Array.from(new Set(list.map((v: any) => v.user_id))).filter(Boolean)

  const [profilesRes, modelDetailsRes, clubDetailsRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, email, username, public_id, role')
      .in('id', userIds),
    admin
      .from('model_details')
      .select('model_id, showname')
      .in('model_id', userIds),
    admin
      .from('club_details')
      .select('club_id, club_name')
      .in('club_id', userIds),
  ])

  const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]))
  const modelMap = new Map((modelDetailsRes.data || []).map((m: any) => [m.model_id, m]))
  const clubMap = new Map((clubDetailsRes.data || []).map((c: any) => [c.club_id, c]))

  const merged = list.map((v: any) => {
    const p = profileMap.get(v.user_id) as any
    return {
      ...v,
      profile: p
        ? {
            email: p.email,
            username: p.username,
            public_id: p.public_id,
            role: p.role,
            model_details: modelMap.get(v.user_id)
              ? { showname: (modelMap.get(v.user_id) as any).showname }
              : null,
            club_details: clubMap.get(v.user_id)
              ? { club_name: (clubMap.get(v.user_id) as any).club_name }
              : null,
          }
        : null,
    }
  })

  return NextResponse.json({ verifications: merged })
}

/**
 * POST — approve or reject a verification.
 * Body: { id, userId, decision: 'approved' | 'rejected', reason? }
 */
export async function POST(req: NextRequest) {
  const reviewer = await verifyAdmin()
  if (!reviewer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, userId, decision, reason } = body || {}
  if (!id || !userId || (decision !== 'approved' && decision !== 'rejected')) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  if (decision === 'rejected' && !String(reason || '').trim()) {
    return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const nowIso = new Date().toISOString()

  const { error: vErr } = await admin
    .from('verifications')
    .update({
      status: decision,
      reviewed_at: nowIso,
      reviewed_by: reviewer.id,
      rejection_reason: decision === 'rejected' ? reason : null,
    })
    .eq('id', id)
  if (vErr) {
    return NextResponse.json({ error: vErr.message }, { status: 500 })
  }

  const { error: pErr } = await admin
    .from('profiles')
    .update({ is_verified: decision === 'approved' })
    .eq('id', userId)
  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('role, email, username')
    .eq('id', userId)
    .single()

  const role = (targetProfile as any)?.role
  const rolePath = role === 'model' ? 'model' : role === 'company' ? 'company' : 'user'

  await admin.from('notifications').insert({
    user_id: userId,
    type: decision === 'approved' ? 'verification_approved' : 'verification_rejected',
    title: decision === 'approved' ? 'Verification Approved' : 'Verification Rejected',
    message:
      decision === 'approved'
        ? 'Your identity verification has been approved! You now have a verified badge.'
        : `Your verification was rejected: ${reason}`,
    is_read: false,
    action_url: `/dashboard/${rolePath}/verification`,
    related_entity_type: 'verification',
    related_entity_id: id,
  })

  if ((targetProfile as any)?.email) {
    const args = {
      email: (targetProfile as any).email as string,
      userId,
      displayName: (targetProfile as any).username as string,
    }
    try {
      if (decision === 'approved') {
        await sendVerificationApprovedEmail(args)
      } else {
        await sendVerificationRejectedEmail({ ...args, reason: reason ?? null })
      }
    } catch {
      /* non-fatal */
    }
  }

  return NextResponse.json({ success: true })
}
