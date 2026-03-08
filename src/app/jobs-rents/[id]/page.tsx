import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ListingDetailClient from './ListingDetailClient'

export const revalidate = 60

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const { data: listing } = await admin
    .from('job_listings')
    .select('*')
    .eq('id', id)
    .neq('status', 'deleted')
    .single()

  if (!listing) notFound()

  const [{ data: clubDetails }, { data: photos }, { data: serviceLinks }] = await Promise.all([
    admin.from('club_details').select('club_id, club_name, display_name, area').eq('club_id', listing.club_id).single(),
    admin.from('job_listing_photos').select('id, file_path, display_order').eq('listing_id', id).order('display_order'),
    admin.from('job_listing_services').select('listing_id, service_id, services(id, name)').eq('listing_id', id),
  ])

  const photoUrls = (photos ?? []).map(p => `${SUPA_URL}/storage/v1/object/public/job-listing-photos/${p.file_path}`)
  const services = (serviceLinks ?? [])
    .map(s => (s as any).services)
    .filter(Boolean)

  return (
    <>
      <Navbar />
      <ListingDetailClient
        listing={{
          id: listing.id,
          listing_type: listing.listing_type,
          title: listing.title || null,
          location: listing.location,
          description: listing.description,
          country_code: listing.country_code,
          phone_number: listing.phone_number,
          has_whatsapp: listing.has_whatsapp,
          has_viber: listing.has_viber,
          has_telegram: listing.has_telegram,
          email: listing.email,
          website: listing.website,
          created_at: listing.created_at,
          club_id: listing.club_id,
          club_name: clubDetails?.display_name || clubDetails?.club_name || 'Club',
          club_area: clubDetails?.area || null,
          photos: photoUrls,
          services,
        }}
      />
    </>
  )
}
