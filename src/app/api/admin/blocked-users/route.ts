import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** List all blocked profiles (any role). Uses service role — RLS would hide most rows from the browser client. */
export async function GET() {
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

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select(
        'id, email, username, public_id, role, created_at, blocked_at, blocked_reason, model_details!model_details_model_id_fkey (showname), club_details!club_details_club_id_fkey (club_name, display_name)',
      )
      .eq('is_blocked', true)
      .order('blocked_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const users = (data || []).map((u: any) => ({
      ...u,
      model_details: Array.isArray(u.model_details) ? u.model_details[0] : u.model_details,
      club_details: Array.isArray(u.club_details) ? u.club_details[0] : u.club_details,
    }))

    return NextResponse.json({ users })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
