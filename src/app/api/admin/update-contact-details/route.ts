import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dashboardPathForRole, notifyAdminAction } from '@/lib/admin/notify'

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

    const { table, data } = await request.json()

    if (table !== 'club_contact_details' && table !== 'model_contact_details') {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const admin = createAdminClient()
    const conflictCol = table === 'club_contact_details' ? 'club_id' : 'model_id'

    const { error } = await admin.from(table).upsert(data, { onConflict: conflictCol })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const targetUserId = (data as Record<string, unknown>)[conflictCol]
    if (typeof targetUserId === 'string' && targetUserId) {
      const role = table === 'club_contact_details' ? 'company' : 'model'
      await notifyAdminAction({
        userId: targetUserId,
        title: 'Your contact details were updated',
        message: 'An administrator updated your contact details.',
        actionUrl: dashboardPathForRole(role, 'profile'),
        relatedEntityType: table,
        relatedEntityId: targetUserId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
