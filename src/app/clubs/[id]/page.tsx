import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ClubProfileClient from './ClubProfileClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClubPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch club profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'company')
    .single()

  if (!profile) {
    notFound()
  }

  // Fetch club details
  const { data: clubDetails } = await supabase
    .from('club_details')
    .select('*')
    .eq('club_id', id)
    .single()

  // Fetch club contact details
  const { data: contactDetails } = await supabase
    .from('club_contact_details')
    .select('*')
    .eq('club_id', id)
    .maybeSingle()

  // Fetch working hours
  const { data: workingHours } = await supabase
    .from('club_working_hours')
    .select('*')
    .eq('club_id', id)
    .maybeSingle()

  // Fetch club photos
  const { data: photos } = await supabase
    .from('club_photos')
    .select('*')
    .eq('club_id', id)
    .eq('is_approved', true)
    .order('uploaded_at', { ascending: false })

  // Transform photos to include public URLs
  const photosWithUrls = photos?.map(photo => {
    const { data: urlData } = supabase.storage
      .from('club-photos')
      .getPublicUrl(photo.file_path)
    
    return {
      ...photo,
      url: urlData.publicUrl
    }
  }) || []

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const admin = createAdminClient()
  let clubModels: any[] = []

  const { data: accepted } = await admin
    .from('club_invites')
    .select('invited_model_id')
    .eq('club_id', id)
    .eq('status', 'accepted')

  if (accepted?.length) {
    const modelIds = accepted.map((a: any) => a.invited_model_id)

    const [{ data: modelProfiles }, { data: modelDetails }, { data: modelPhotos }] = await Promise.all([
      admin.from('profiles').select('id, username, is_verified').in('id', modelIds),
      admin.from('model_details').select('model_id, showname, city, age').in('model_id', modelIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', modelIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    ])

    const detailsMap = new Map((modelDetails ?? []).map((d: any) => [d.model_id, d]))
    const photosMap = new Map<string, string>()
    for (const p of modelPhotos ?? []) {
      if (!photosMap.has(p.model_id) && p.file_path) {
        photosMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }

    clubModels = (modelProfiles ?? []).map((p: any) => ({
      ...p,
      ...(detailsMap.get(p.id) || {}),
      photoUrl: photosMap.get(p.id) || null,
    }))
  }

  return (
    <ClubProfileClient
      profile={profile}
      clubDetails={clubDetails}
      contactDetails={contactDetails}
      workingHours={workingHours}
      photos={photosWithUrls}
      clubModels={clubModels}
    />
  )
}
