import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendListingBlockedEmail,
  sendListingUnblockedEmail,
} from '@/lib/email/templates'

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

    const { listingId, block, reason } = await request.json()

    if (!listingId || typeof block !== 'boolean') {
      return NextResponse.json({ error: 'Missing listingId or block parameter' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: listing } = await admin
      .from('job_listings')
      .select('id, title, listing_type, club_id')
      .eq('id', listingId)
      .single()

    const { error } = await admin
      .from('job_listings')
      .update({ is_blocked: block })
      .eq('id', listingId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (listing?.club_id) {
      const { data: owner } = await admin
        .from('profiles')
        .select('email, username')
        .eq('id', listing.club_id)
        .single()

      if (owner?.email) {
        const args = {
          email: owner.email,
          userId: listing.club_id,
          displayName: owner.username,
          listingTitle: listing.title || (listing.listing_type === 'rent' ? 'Rent listing' : 'Job listing'),
          listingType: (listing.listing_type ?? 'job') as 'job' | 'rent',
        }
        ;(block
          ? sendListingBlockedEmail({ ...args, reason: reason ?? null })
          : sendListingUnblockedEmail(args)
        ).catch(() => {})
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
