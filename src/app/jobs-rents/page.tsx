import { createAdminClient } from '@/lib/supabase/admin'
import Navbar from '@/components/layout/Navbar'
import JobsRentsPageClient from './JobsRentsPageClient'

export const revalidate = 60

export default async function JobsRentsPage() {
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const now = new Date().toISOString()

  const { data: listings } = await admin
    .from('job_listings')
    .select('*')
    .eq('status', 'active')
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })

  const allListings = listings ?? []
  const listingIds = allListings.map(l => l.id)
  const clubIds = [...new Set(allListings.map(l => l.club_id))]

  let clubDetailsMap = new Map<string, any>()
  let photosMap = new Map<string, string[]>()
  let servicesMap = new Map<string, any[]>()

  if (listingIds.length > 0) {
    const [{ data: clubDetails }, { data: photos }, { data: serviceLinks }] = await Promise.all([
      admin.from('club_details').select('club_id, club_name, display_name, area').in('club_id', clubIds),
      admin.from('job_listing_photos').select('listing_id, file_path').in('listing_id', listingIds).order('display_order'),
      admin.from('job_listing_services').select('listing_id, service_id, services(id, name)').in('listing_id', listingIds),
    ])

    for (const c of clubDetails ?? []) clubDetailsMap.set(c.club_id, c)

    for (const p of photos ?? []) {
      if (!photosMap.has(p.listing_id)) photosMap.set(p.listing_id, [])
      photosMap.get(p.listing_id)!.push(`${SUPA_URL}/storage/v1/object/public/job-listing-photos/${p.file_path}`)
    }

    for (const s of serviceLinks ?? []) {
      if (!servicesMap.has(s.listing_id)) servicesMap.set(s.listing_id, [])
      if ((s as any).services) servicesMap.get(s.listing_id)!.push((s as any).services)
    }
  }

  const enriched = allListings.map(l => ({
    id: l.id,
    listing_type: l.listing_type,
    title: l.title || null,
    location: l.location,
    description: l.description,
    country_code: l.country_code,
    phone_number: l.phone_number,
    has_whatsapp: l.has_whatsapp,
    has_viber: l.has_viber,
    has_telegram: l.has_telegram,
    email: l.email,
    website: l.website,
    created_at: l.created_at,
    club_id: l.club_id,
    club_name: clubDetailsMap.get(l.club_id)?.display_name || clubDetailsMap.get(l.club_id)?.club_name || 'Club',
    club_area: clubDetailsMap.get(l.club_id)?.area || null,
    photos: photosMap.get(l.id) || [],
    services: servicesMap.get(l.id) || [],
  }))

  return (
    <>
      <Navbar />
      <JobsRentsPageClient listings={enriched} />
    </>
  )
}
