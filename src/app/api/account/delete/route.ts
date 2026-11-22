import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAccountDeletedEmail } from '@/lib/email/templates'

/**
 * Permanently delete an account: the signed-in user's own, or any account
 * when an admin passes `userId`.
 *
 * A snapshot of the profile and its role-specific data is archived in
 * `deleted_accounts` first. Deleting the auth user then frees the email for
 * re-registration and cascades to the public profile.
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

    // The archive is the only record of a deleted account, so a failed insert
    // stops the deletion.
    const { error: archiveError } = await admin.from('deleted_accounts').insert({
      original_user_id: userIdToDelete,
      email: profile.email,
      username: profile.username,
      role,
      reason,
      deleted_by: deletedBy,
      snapshot,
    })

    if (archiveError) {
      return NextResponse.json(
        { error: `Account not deleted: could not archive it first (${archiveError.message})` },
        { status: 500 },
      )
    }

    // Some foreign keys lack ON DELETE CASCADE, which makes the auth API fail;
    // the admin_delete_user RPC removes dependent rows first.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userIdToDelete)
    if (deleteError) {
      const { error: rpcError } = await admin.rpc('admin_delete_user', { target_id: userIdToDelete })
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
