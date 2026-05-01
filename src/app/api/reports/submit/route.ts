import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReportReceivedEmail } from '@/lib/email/templates'
import { SUPPORT_EMAIL } from '@/lib/email/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const reportedId     = formData.get('reported_id') as string
    const conversationId = formData.get('conversation_id') as string
    const reason         = formData.get('reason') as string | null
    const screenshot     = formData.get('screenshot') as File | null

    if (!reportedId || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()
    let screenshotPath: string | null = null

    if (screenshot && screenshot.size > 0) {
      const ext = screenshot.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}/${Date.now()}.${ext}`
      const buffer = await screenshot.arrayBuffer()

      const { error: uploadError } = await admin.storage
        .from('report-screenshots')
        .upload(fileName, buffer, {
          contentType: screenshot.type,
          upsert: false,
        })

      if (uploadError) {
        return NextResponse.json({ error: 'Failed to upload screenshot: ' + uploadError.message }, { status: 500 })
      }

      screenshotPath = fileName
    }

    const { data: insertedReport, error: insertError } = await admin
      .from('reports')
      .insert({
        reporter_id:     user.id,
        reported_id:     reportedId,
        conversation_id: conversationId,
        reason:          reason || null,
        screenshot_path: screenshotPath,
        status:          'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Side effects: in-app notifications + admin email. Never fail the request on these.
    try {
      const [{ data: reporter }, { data: reported }, { data: admins }] = await Promise.all([
        admin.from('profiles').select('id, username').eq('id', user.id).single(),
        admin.from('profiles').select('id, username').eq('id', reportedId).single(),
        admin.from('profiles').select('id').eq('role', 'admin'),
      ])

      const reporterName = reporter?.username || 'A user'
      const reportedName = reported?.username || 'another user'

      // 1. In-app notification for every admin → makes the bell turn red.
      if (admins && admins.length > 0) {
        await admin.from('notifications').insert(
          admins.map(a => ({
            user_id: a.id,
            type: 'report_received',
            title: 'New user report',
            message: `${reporterName} reported ${reportedName}${reason ? `: "${reason.slice(0, 80)}"` : ''}`,
            is_read: false,
            action_url: '/dashboard/admin/reports',
            related_entity_type: 'report',
            related_entity_id: insertedReport?.id ?? null,
          }))
        )
      }

      // 2. Email the support / admin inbox.
      sendReportReceivedEmail({
        to: SUPPORT_EMAIL,
        reporterName,
        reportedName,
        reason: reason ?? null,
        reportId: insertedReport?.id ?? '',
      }).catch(() => {})
    } catch {
      // best-effort — never break the user flow on email/notification failure
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
