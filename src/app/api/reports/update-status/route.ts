import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReportResolvedEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { reportId, status } = await request.json()
  if (!reportId || !['reviewed', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Read reporter info before update so we can mail them.
  const { data: report } = await admin
    .from('reports')
    .select('id, reporter_id')
    .eq('id', reportId)
    .single()

  const { error } = await admin.from('reports').update({
    status,
    reviewed_at: new Date().toISOString(),
  }).eq('id', reportId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Side effects: in-app notification + email to the reporter. Best-effort.
  try {
    if (report?.reporter_id) {
      const { data: reporter } = await admin
        .from('profiles')
        .select('email, username')
        .eq('id', report.reporter_id)
        .single()

      await admin.from('notifications').insert({
        user_id: report.reporter_id,
        type: 'report_resolved',
        title: status === 'reviewed' ? 'Your report has been reviewed' : 'Your report was dismissed',
        message: status === 'reviewed'
          ? 'Our team has reviewed your report and taken action.'
          : 'After review, our team determined no action is needed.',
        is_read: false,
        action_url: null,
        related_entity_type: 'report',
        related_entity_id: reportId,
      })

      if (reporter?.email) {
        sendReportResolvedEmail({
          email: reporter.email,
          userId: report.reporter_id,
          displayName: reporter.username,
          status: status as 'reviewed' | 'dismissed',
        }).catch(() => {})
      }
    }
  } catch {
    // never fail the API call on side-effect issues
  }

  return NextResponse.json({ success: true })
}
