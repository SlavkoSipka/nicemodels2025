import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    const { data: reports, error } = await admin
      .from('reports')
      .select(`
        id, created_at, reason, screenshot_path, status, conversation_id,
        reporter_id, reported_id
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const reporterIds = [...new Set((reports || []).map(r => r.reporter_id))]
    const reportedIds = [...new Set((reports || []).map(r => r.reported_id))]
    const allIds = [...new Set([...reporterIds, ...reportedIds])]

    if (allIds.length === 0) {
      return NextResponse.json({ reports: reports || [] })
    }

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, username, public_id, role')
      .in('id', allIds)

    const profileMap = new Map((profiles || []).map(p => [p.id, p]))

    const mapped = (reports || []).map(r => ({
      ...r,
      reporter: profileMap.get(r.reporter_id) || { id: r.reporter_id, username: 'N/A', public_id: null, role: 'unknown' },
      reported: profileMap.get(r.reported_id) || { id: r.reported_id, username: 'N/A', public_id: null, role: 'unknown' },
    }))

    return NextResponse.json({ reports: mapped })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
