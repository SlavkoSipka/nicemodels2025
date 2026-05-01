import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdminAction } from '@/lib/admin/notify'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { listingId, ...fields } = body

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
    }

    const allowed = [
      'title', 'location', 'status', 'listing_type', 'description',
      'country_code', 'phone_number', 'has_whatsapp', 'has_viber',
      'has_telegram', 'has_sms', 'email', 'website',
      'rent_price_daily', 'rent_price_weekly', 'rent_price_monthly',
      'rent_work_permit', 'rent_room_size', 'rent_furnished',
      'rent_kitchen', 'rent_bathroom', 'rent_air_conditioning', 'rent_towels',
    ]

    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in fields) updates[key] = fields[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: listingBefore } = await admin
      .from('job_listings')
      .select('club_id, title, listing_type')
      .eq('id', listingId)
      .single()

    const { error } = await admin
      .from('job_listings')
      .update(updates)
      .eq('id', listingId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (listingBefore?.club_id) {
      const typeLabel = listingBefore.listing_type === 'rent' ? 'rent listing' : 'job listing'
      await notifyAdminAction({
        userId: listingBefore.club_id,
        title: `Your ${typeLabel} was updated`,
        message: `An administrator updated "${listingBefore.title || typeLabel}".`,
        actionUrl: '/dashboard/company/jobs-rent',
        relatedEntityType: 'job_listing',
        relatedEntityId: listingId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
