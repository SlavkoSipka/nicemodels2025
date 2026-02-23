import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ModelProfileClient from './ModelProfileClient'

interface ModelPageProps {
  params: Promise<{ id: string }>
}

async function getModelData(id: string) {
  const supabase = await createClient()

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'model')
    .single()

  if (profileError || !profile) {
    return null
  }

  // Fetch model details
  const { data: modelDetails } = await supabase
    .from('model_details')
    .select('*')
    .eq('model_id', id)
    .single()

  // Fetch photos
  const { data: photos } = await supabase
    .from('model_photos')
    .select('*')
    .eq('model_id', id)
    .eq('is_approved', true)
    .order('uploaded_at', { ascending: false })

  // Fetch videos
  const { data: videos } = await supabase
    .from('model_videos')
    .select('*')
    .eq('model_id', id)
    .eq('is_approved', true)
    .order('uploaded_at', { ascending: false })

  // Fetch rates
  const { data: rates } = await supabase
    .from('model_rates')
    .select('*')
    .eq('model_id', id)
    .order('rate_type', { ascending: true })

  // Fetch services
  const { data: modelServices } = await supabase
    .from('model_services')
    .select(`
      *,
      service:services(*)
    `)
    .eq('model_id', id)

  // Fetch languages
  const { data: languages } = await supabase
    .from('model_languages')
    .select('*')
    .eq('model_id', id)

  // Fetch working hours
  const { data: workingHours } = await supabase
    .from('model_working_hours')
    .select('*')
    .eq('model_id', id)
    .order('day_of_week', { ascending: true })

  // Fetch contact details
  const { data: contactDetails } = await supabase
    .from('model_contact_details')
    .select('*')
    .eq('model_id', id)
    .single()

  // Fetch approved comments for this model
  const { data: comments } = await supabase
    .from('model_comments')
    .select(`
      id,
      comment_text,
      rating,
      created_at,
      user:profiles!model_comments_user_id_fkey (
        id,
        username
      )
    `)
    .eq('model_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  return {
    profile,
    modelDetails,
    photos: photos || [],
    videos: videos || [],
    rates: rates || [],
    services: modelServices || [],
    languages: languages || [],
    workingHours: workingHours || [],
    contactDetails,
    comments: comments || []
  }
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { id } = await params
  const modelData = await getModelData(id)

  if (!modelData) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <ModelProfileClient modelData={modelData} />
      <Footer />
    </>
  )
}
