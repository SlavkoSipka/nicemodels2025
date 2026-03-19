import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'model') {
      return NextResponse.json({ error: 'Only models can share live location' }, { status: 403 })
    }

    const { lat, lng } = await request.json()
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    const { data: nearest, error: rpcError } = await supabase
      .rpc('find_nearest_city_by_wgs84', { p_lat: lat, p_lng: lng })

    if (rpcError || !nearest || nearest.length === 0) {
      return NextResponse.json(
        { error: 'Could not determine location' },
        { status: 422 },
      )
    }

    const city = nearest[0]

    const { error: updateError } = await supabase
      .from('model_details')
      .update({
        share_live_location: true,
        live_location_city: city.city_name,
        live_location_postal_code: city.city_postal_code,
        live_location_updated_at: new Date().toISOString(),
      })
      .eq('model_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      city: city.city_name,
      postal_code: city.city_postal_code,
      canton: city.city_canton,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('model_details')
      .update({
        share_live_location: false,
        live_location_city: null,
        live_location_postal_code: null,
        live_location_updated_at: null,
      })
      .eq('model_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
