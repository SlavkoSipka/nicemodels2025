import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import AdminClubEditClient from './AdminClubEditClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminClubEditPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const [
    { data: profile },
    { data: clubDetails },
    { data: contactDetails },
    { data: photos },
    { data: videos },
    { data: workingHours },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).eq('role', 'company').single(),
    admin.from('club_details').select('*').eq('club_id', id).single(),
    admin.from('club_contact_details').select('*').eq('club_id', id).single(),
    admin.from('club_photos').select('*').eq('club_id', id).order('uploaded_at', { ascending: false }),
    admin.from('club_videos').select('*').eq('club_id', id).order('uploaded_at', { ascending: false }),
    admin.from('club_working_hours').select('*').eq('club_id', id).order('day_of_week', { ascending: true }),
  ])

  if (!profile) notFound()

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  return (
    <AdminClubEditClient
      clubId={id}
      profile={profile}
      clubDetails={clubDetails}
      contactDetails={contactDetails}
      photos={(photos || []).map((p: any) => ({
        ...p,
        url: p.file_path ? `${SUPA_URL}/storage/v1/object/public/club-photos/${p.file_path}` : null,
      }))}
      videos={(videos || []).map((v: any) => ({
        ...v,
        url: v.file_path ? `${SUPA_URL}/storage/v1/object/public/club-videos/${v.file_path}` : null,
      }))}
      workingHours={workingHours || []}
    />
  )
}
