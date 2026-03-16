import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    const { error: insertError } = await admin.from('reports').insert({
      reporter_id:     user.id,
      reported_id:     reportedId,
      conversation_id: conversationId,
      reason:          reason || null,
      screenshot_path: screenshotPath,
      status:          'pending',
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
