import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const json = await request.json()
    const id = typeof json.id === 'string' ? json.id : ''
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    if (typeof json.is_deleted !== 'boolean') {
      return NextResponse.json({ error: 'is_deleted boolean required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('discussion_posts').update({ is_deleted: json.is_deleted }).eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
