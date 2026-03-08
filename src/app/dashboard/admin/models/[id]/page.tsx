import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import AdminModelEditClient from './AdminModelEditClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminModelEditPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const [
    { data: profile },
    { data: modelDetails },
    { data: photos },
    { data: videos },
    { data: contactDetails },
    { data: languages },
    { data: services },
    { data: allServices },
    { data: workingHours },
    { data: rates },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).eq('role', 'model').single(),
    admin.from('model_details').select('*').eq('model_id', id).single(),
    admin.from('model_photos').select('*').eq('model_id', id).order('uploaded_at', { ascending: false }),
    admin.from('model_videos').select('*').eq('model_id', id).order('uploaded_at', { ascending: false }),
    admin.from('model_contact_details').select('*').eq('model_id', id).single(),
    admin.from('model_languages').select('*').eq('model_id', id),
    admin.from('model_services').select('service_id').eq('model_id', id),
    admin.from('services').select('*').order('category').order('name'),
    admin.from('model_working_hours').select('*').eq('model_id', id).order('day_of_week', { ascending: true }),
    admin.from('model_rates').select('*').eq('model_id', id).order('rate_type').order('duration'),
  ])

  if (!profile) notFound()

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  return (
    <AdminModelEditClient
      modelId={id}
      profile={profile}
      modelDetails={modelDetails}
      photos={(photos || []).map((p: any) => ({
        ...p,
        url: p.file_path ? `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}` : null,
      }))}
      videos={(videos || []).map((v: any) => ({
        ...v,
        url: v.file_path ? `${SUPA_URL}/storage/v1/object/public/model-videos/${v.file_path}` : null,
      }))}
      contactDetails={contactDetails}
      languages={languages || []}
      modelServices={(services || []).map((s: any) => s.service_id)}
      allServices={allServices || []}
      workingHours={workingHours || []}
      rates={rates || []}
    />
  )
}
