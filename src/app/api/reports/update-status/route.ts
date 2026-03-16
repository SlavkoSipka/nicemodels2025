import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
  const { error } = await admin.from('reports').update({
    status,
    reviewed_at: new Date().toISOString(),
  }).eq('id', reportId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
