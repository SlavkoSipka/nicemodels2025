import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * Marks onboarding complete for the signed-in user. Uses the service role so
 * this still works when RLS blocks direct client updates on `profiles`.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profile, error: readErr } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (readErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const role = profile.role as string | null
  if (!role || !['model', 'company', 'user'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
  }

  const { error: updErr } = await admin
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
