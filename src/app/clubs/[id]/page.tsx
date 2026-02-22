import { createClient } from '@/lib/supabase/server'
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

  return (
    <ClubProfileClient
      profile={profile}
      clubDetails={clubDetails}
      contactDetails={contactDetails}
      workingHours={workingHours}
      photos={photosWithUrls}
    />
  )
}
