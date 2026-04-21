import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ListingDetailClient from './ListingDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const { data: listing } = await admin
    .from('job_listings')
    .select('listing_type, title, location, description, club_id')
    .eq('id', id)
    .single()

  if (!listing) {
    return { title: 'Listing nicht gefunden' }
  }

  const isJob = listing.listing_type === 'job'
  const typeLabel = isJob ? 'Job' : 'Miete'
  const title = listing.title || (isJob ? 'Stellenangebot' : 'Mietangebot')
  const location = listing.location || 'Schweiz'
  const pageTitle = `${title} – ${typeLabel} in ${location}`
  const desc =
    listing.description?.replace(/<[^>]*>/g, '').slice(0, 155).trimEnd() ||
    `${typeLabel}-Angebot in ${location}. Jetzt Details ansehen auf NiceModels.ch`

  const { data: photo } = await admin
    .from('job_listing_photos')
    .select('file_path')
    .eq('listing_id', id)
    .order('display_order')
    .limit(1)
    .single()

  const ogImage = photo?.file_path
    ? `${SUPA_URL}/storage/v1/object/public/job-listing-photos/${photo.file_path}`
    : '/logo.webp'

  return {
    title: pageTitle,
    description: desc,
    openGraph: {
      title: pageTitle,
      description: desc,
      type: 'article',
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: desc,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://www.nicemodels.ch/jobs-rents/${id}`,
    },
  }
}

export default async function ListingDetailPage({ params }: PageProps) {
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

  // Hide listings owned by blocked clubs from public view
  if (listing.club_id) {
    const { data: clubProfile } = await admin
      .from('profiles')
      .select('is_blocked')
      .eq('id', listing.club_id)
      .single()
    if (clubProfile?.is_blocked) notFound()
  }

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
          has_sms: listing.has_sms ?? false,
          email: listing.email,
          website: listing.website,
          created_at: listing.created_at,
          club_id: listing.club_id,
          club_name: clubDetails?.display_name || clubDetails?.club_name || 'Club',
          club_area: clubDetails?.area || null,
          photos: photoUrls,
          services,
          rent_price_daily: listing.rent_price_daily ?? null,
          rent_price_weekly: listing.rent_price_weekly ?? null,
          rent_price_monthly: listing.rent_price_monthly ?? null,
          rent_work_permit: listing.rent_work_permit ?? false,
          rent_room_size: listing.rent_room_size ?? null,
          rent_furnished: listing.rent_furnished ?? false,
          rent_kitchen: listing.rent_kitchen ?? false,
          rent_bathroom: listing.rent_bathroom ?? false,
          rent_air_conditioning: listing.rent_air_conditioning ?? false,
          rent_towels: listing.rent_towels ?? false,
        }}
      />
    </>
  )
}
