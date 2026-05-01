import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdminAction } from '@/lib/admin/notify'

// POST: sync (replace all) services for a listing
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { listingId, serviceIds } = await request.json()
    if (!listingId) return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })

    const admin = createAdminClient()

    const { data: listing } = await admin
      .from('job_listings')
      .select('club_id, title, listing_type')
      .eq('id', listingId)
      .single()

    await admin.from('job_listing_services').delete().eq('listing_id', listingId)

    if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      const { error } = await admin.from('job_listing_services').insert(
        serviceIds.map((sid: string) => ({ listing_id: listingId, service_id: sid }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (listing?.club_id) {
      const typeLabel = listing.listing_type === 'rent' ? 'rent listing' : 'job listing'
      await notifyAdminAction({
        userId: listing.club_id,
        title: `Services updated on your ${typeLabel}`,
        message: `An administrator updated the services on "${listing.title || typeLabel}".`,
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
