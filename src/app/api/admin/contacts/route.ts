import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = request.nextUrl.searchParams.get('role')
    if (role !== 'model' && role !== 'company') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const admin = createAdminClient()

    if (role === 'model') {
      const { data, error } = await admin
        .from('model_contact_details')
        .select('model_id, country_code, phone_number')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ contacts: data || [] })
    }

    const { data, error } = await admin
      .from('club_contact_details')
      .select('club_id, country_code, phone_number, email, website')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ contacts: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
