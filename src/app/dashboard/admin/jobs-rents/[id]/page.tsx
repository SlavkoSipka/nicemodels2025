import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminListingEditClient from './AdminListingEditClient'

export default async function AdminListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/admin')

  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const [
    { data: listing },
    { data: photos },
    { data: listingServices },
    { data: allServices },
  ] = await Promise.all([
    admin.from('job_listings').select('*').eq('id', id).single(),
    admin.from('job_listing_photos').select('id, file_path, file_name, display_order').eq('listing_id', id).order('display_order'),
    admin.from('job_listing_services').select('service_id').eq('listing_id', id),
    admin.from('services').select('id, name, category').order('category').order('name'),
  ])

  if (!listing) redirect('/dashboard/admin/jobs-rents')

  const enrichedPhotos = (photos || []).map(p => ({
    id: p.id,
    file_path: p.file_path,
    url: `${SUPA_URL}/storage/v1/object/public/job-listing-photos/${p.file_path}`,
  }))

  return (
    <AdminListingEditClient
      listing={listing}
      photos={enrichedPhotos}
      selectedServiceIds={(listingServices || []).map(s => s.service_id)}
      allServices={allServices || []}
      supaUrl={SUPA_URL}
    />
  )
}
