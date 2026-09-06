import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdminAction } from '@/lib/admin/notify'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

// POST: upload a new photo for a listing
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await request.formData()
    const listingId = formData.get('listing_id') as string
    const photo = formData.get('photo') as File | null
    const displayOrder = parseInt(formData.get('display_order') as string || '0', 10)

    if (!listingId || !photo || photo.size === 0) {
      return NextResponse.json({ error: 'Missing listing_id or photo' }, { status: 400 })
    }

    const ext = photo.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
    const filePath = `admin/${listingId}/${fileName}`
    const buffer = await photo.arrayBuffer()

    const admin = createAdminClient()

    const { error: uploadError } = await admin.storage
      .from('job-listing-photos')
      .upload(filePath, buffer, { contentType: photo.type, cacheControl: '31536000', upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: inserted, error: dbError } = await admin
      .from('job_listing_photos')
      .insert({ listing_id: listingId, file_path: filePath, file_name: photo.name, display_order: displayOrder })
      .select('id, file_path')
      .single()

    if (dbError) {
      await admin.storage.from('job-listing-photos').remove([filePath])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    const { data: listing } = await admin
      .from('job_listings')
      .select('club_id, title, listing_type')
      .eq('id', listingId)
      .single()
    if (listing?.club_id) {
      const typeLabel = listing.listing_type === 'rent' ? 'rent listing' : 'job listing'
      await notifyAdminAction({
        userId: listing.club_id,
        title: `Photo added to your ${typeLabel}`,
        message: `An administrator added a photo to "${listing.title || typeLabel}".`,
        actionUrl: '/dashboard/company/jobs-rent',
        relatedEntityType: 'job_listing',
        relatedEntityId: listingId,
      })
    }

    return NextResponse.json({ success: true, photo: inserted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// DELETE: remove a photo by its DB id
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { photoId } = await request.json()
    if (!photoId) return NextResponse.json({ error: 'Missing photoId' }, { status: 400 })

    const admin = createAdminClient()

    const { data: photo } = await admin
      .from('job_listing_photos')
      .select('file_path, listing_id')
      .eq('id', photoId)
      .single()

    if (photo?.file_path) {
      await admin.storage.from('job-listing-photos').remove([photo.file_path])
    }

    await admin.from('job_listing_photos').delete().eq('id', photoId)

    if (photo?.listing_id) {
      const { data: listing } = await admin
        .from('job_listings')
        .select('club_id, title, listing_type')
        .eq('id', photo.listing_id)
        .single()
      if (listing?.club_id) {
        const typeLabel = listing.listing_type === 'rent' ? 'rent listing' : 'job listing'
        await notifyAdminAction({
          userId: listing.club_id,
          title: `Photo removed from your ${typeLabel}`,
          message: `An administrator removed a photo from "${listing.title || typeLabel}".`,
          actionUrl: '/dashboard/company/jobs-rent',
          relatedEntityType: 'job_listing',
          relatedEntityId: photo.listing_id,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
