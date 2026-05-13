import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAccountDeletedEmail } from '@/lib/email/templates'

/**
 * Permanently delete an account.
 *
 * - Authenticated user calling without `userId` → deletes self.
 * - Admin calling with `userId` → deletes the target user.
 *
 * Flow:
 *   1. Snapshot profile (+ role-specific details) into `deleted_accounts`.
 *   2. Call `admin.auth.admin.deleteUser(userId)` which removes the row from
 *      `auth.users`, frees the email for re-registration and (via the FK
 *      cascade on `profiles.id`) wipes the public profile.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const targetId: string | undefined = body.userId
    const reason: string | null = (body.reason ?? null) as string | null

    let userIdToDelete = user.id
    let deletedBy = 'self'

    if (targetId && targetId !== user.id) {
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (callerProfile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      userIdToDelete = targetId
      deletedBy = user.id
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userIdToDelete)
      .single()

    if (!profile) {
      // Nothing to archive, but still attempt to clean up the auth row.
      await admin.auth.admin.deleteUser(userIdToDelete)
      return NextResponse.json({ success: true })
    }

    const role = profile.role as string | null
    const snapshot: Record<string, any> = { profile }

    if (role === 'model') {
      const [details, photos, videos, contact] = await Promise.all([
        admin.from('model_details').select('*').eq('model_id', userIdToDelete).maybeSingle(),
        admin.from('model_photos').select('*').eq('model_id', userIdToDelete),
        admin.from('model_videos').select('*').eq('model_id', userIdToDelete),
        admin.from('model_contact_details').select('*').eq('model_id', userIdToDelete).maybeSingle(),
      ])
      snapshot.model_details = details.data
      snapshot.model_photos = photos.data
      snapshot.model_videos = videos.data
      snapshot.model_contact_details = contact.data
    } else if (role === 'company') {
      const [details, photos, contact, listings] = await Promise.all([
        admin.from('club_details').select('*').eq('club_id', userIdToDelete).maybeSingle(),
        admin.from('club_photos').select('*').eq('club_id', userIdToDelete),
        admin.from('club_contact_details').select('*').eq('club_id', userIdToDelete).maybeSingle(),
        admin.from('job_listings').select('*').eq('club_id', userIdToDelete),
      ])
      snapshot.club_details = details.data
      snapshot.club_photos = photos.data
      snapshot.club_contact_details = contact.data
      snapshot.job_listings = listings.data
    }

    await admin.from('deleted_accounts').insert({
      original_user_id: userIdToDelete,
      email: profile.email,
      username: profile.username,
      role,
      reason,
      deleted_by: deletedBy,
      snapshot,
    })

    // #region agent log
    const dbg = (msg: string, data: any) => fetch('http://127.0.0.1:7457/ingest/26dc86b0-b20c-4321-a2ef-f9e42b276fa5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '5f2b96' },
      body: JSON.stringify({ sessionId: '5f2b96', location: 'api/account/delete/route.ts', message: msg, data, timestamp: Date.now() }),
    }).catch(() => {})
    // #endregion
    // #region agent log
    await dbg('attempt:deleteUser', { userIdToDelete, role })
    // #endregion
    const { error: deleteError } = await admin.auth.admin.deleteUser(userIdToDelete)
    // #region agent log
    await dbg('result:deleteUser', { error: deleteError?.message ?? null, name: (deleteError as any)?.name, status: (deleteError as any)?.status })
    // #endregion
    if (deleteError) {
      // #region agent log
      const { data: diagBefore } = await admin.rpc('_debug_delete_diagnostics', { target_id: userIdToDelete })
      await dbg('diagnostics:before_rpc', diagBefore)
      // #endregion
      const { error: rpcError } = await admin.rpc('admin_delete_user', { target_id: userIdToDelete })
      // #region agent log
      await dbg('result:admin_delete_user_rpc', { error: rpcError?.message ?? null, code: (rpcError as any)?.code, details: (rpcError as any)?.details, hint: (rpcError as any)?.hint })
      // #endregion
      if (rpcError) {
        return NextResponse.json(
          { error: `${deleteError.message} (fallback: ${rpcError.message})` },
          { status: 500 }
        )
      }
    }

    if (profile.email) {
      sendAccountDeletedEmail({
        email: profile.email,
        userId: null,
        displayName: profile.username,
        byAdmin: deletedBy !== 'self',
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
