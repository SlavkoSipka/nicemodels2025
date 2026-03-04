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

  // Profile must exist first
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'model')
    .single()

  if (profileError || !profile) return null

  // All remaining queries run in PARALLEL
  const [
    { data: modelDetails },
    { data: photos },
    { data: videos },
    { data: rates },
    { data: modelServices },
    { data: languages },
    { data: workingHours },
    { data: contactDetails },
    { data: comments },
  ] = await Promise.all([
    supabase.from('model_details').select('*').eq('model_id', id).single(),
    supabase.from('model_photos').select('*').eq('model_id', id).eq('is_approved', true).order('uploaded_at', { ascending: false }),
    supabase.from('model_videos').select('*').eq('model_id', id).eq('is_approved', true).order('uploaded_at', { ascending: false }),
    supabase.from('model_rates').select('*').eq('model_id', id).order('rate_type', { ascending: true }),
    supabase.from('model_services').select('*, service:services(*)').eq('model_id', id),
    supabase.from('model_languages').select('*').eq('model_id', id),
    supabase.from('model_working_hours').select('*').eq('model_id', id).order('day_of_week', { ascending: true }),
    supabase.from('model_contact_details').select('*').eq('model_id', id).single(),
    supabase
      .from('model_comments')
      .select('id, comment_text, rating, created_at, user:profiles!model_comments_user_id_fkey(id, username)')
      .eq('model_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
  ])

  return {
    profile,
    modelDetails,
    photos:       photos        || [],
    videos:       videos        || [],
    rates:        rates         || [],
    services:     modelServices || [],
    languages:    languages     || [],
    workingHours: workingHours  || [],
    contactDetails,
    comments:     comments      || [],
  }
}

// Module-level TTL cache for active model IDs (same set shown on homepage)
let _idsCache: { ids: string[]; at: number } | null = null
const IDS_TTL = 60_000

async function getCachedAllModelIds(): Promise<string[]> {
  if (_idsCache && Date.now() - _idsCache.at < IDS_TTL) return _idsCache.ids
  const supabase = await createClient()
  // Use the same RPC as the homepage so prev/next only cycles through visible models
  const { data, error } = await supabase.rpc('models_with_active_ads')
  let ids: string[]
  if (error || !data?.length) {
    // Fallback: all models ordered by creation
    const { data: fallback } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'model')
      .order('created_at', { ascending: true })
    ids = (fallback || []).map((m: any) => m.id as string)
  } else {
    ids = (data as any[]).map((m: any) => m.id as string)
  }
  _idsCache = { ids, at: Date.now() }
  return ids
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { id } = await params

  // Both fetches in parallel
  const [modelData, allModelIds] = await Promise.all([
    getModelData(id),
    getCachedAllModelIds(),
  ])

  if (!modelData) notFound()

  const total        = allModelIds.length
  const currentIndex = allModelIds.indexOf(id)
  const prevId = total > 1 ? allModelIds[(currentIndex - 1 + total) % total] : null
  const nextId = total > 1 ? allModelIds[(currentIndex + 1) % total]         : null

  return (
    <>
      <Navbar />
      <ModelProfileClient
        modelData={modelData}
        allModelIds={allModelIds}
        prevId={prevId}
        nextId={nextId}
      />
      <Footer />
    </>
  )
}
