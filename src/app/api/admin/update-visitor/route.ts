import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dashboardPathForRole, notifyAdminAction } from '@/lib/admin/notify'

const ALLOWED_FIELDS = [
  'username', 'first_name', 'last_name', 'phone',
  'date_of_birth', 'city', 'description', 'is_blocked',
] as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, ...fields } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in fields) {
        updatePayload[key] = fields[key]
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const admin = createAdminClient()

    if (updatePayload.username) {
      const trimmed = (updatePayload.username as string).trim()
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('username', trimmed)
        .neq('id', userId)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }
      updatePayload.username = trimmed
    }

    if ('is_blocked' in updatePayload) {
      updatePayload.blocked_at = updatePayload.is_blocked ? new Date().toISOString() : null
    }

    updatePayload.updated_at = new Date().toISOString()

    const { error } = await admin
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Skip the generic "profile updated" notification when the only
    // change is a block toggle — `/api/admin/block-user` already
    // emails + notifies for that flow.
    const onlyBlockToggle =
      Object.keys(updatePayload).every(k => k === 'is_blocked' || k === 'blocked_at' || k === 'updated_at')
    if (!onlyBlockToggle) {
      const changedFields = Object.keys(updatePayload).filter(k => k !== 'updated_at' && k !== 'blocked_at')
      const { data: targetRole } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      await notifyAdminAction({
        userId,
        title: 'Your profile was updated',
        message: `An administrator updated your profile (${changedFields.join(', ')}).`,
        actionUrl: dashboardPathForRole(targetRole?.role, 'profile'),
        relatedEntityType: 'profile',
        relatedEntityId: userId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Pokušaj #1: standardni Supabase admin API.
    // Ako neki FK nema ON DELETE CASCADE, ovo će puknuti – fallback ispod
    // koristi `admin_delete_user` RPC koji defanzivno čisti zavisnike.
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) {
      const { error: rpcError } = await admin.rpc('admin_delete_user', { target_id: userId })
      if (rpcError) {
        return NextResponse.json(
          { error: `${error.message} (fallback: ${rpcError.message})` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
