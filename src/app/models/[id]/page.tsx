import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ModelProfileClient from './ModelProfileClient'

interface ModelPageProps {
  params: Promise<{ id: string }>
}

async function getModelData(id: string) {
  const supabase = await createClient()

  // Profile must exist first. Blocked models are hidden from the public sedcard.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'model')
    .eq('is_blocked', false)
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
      .select('id, comment_text, rating, created_at, reply_text, replied_at, user:profiles!model_comments_user_id_fkey(id, username, is_blocked)')
      .eq('model_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
  ])

  // ── Photo likes ──
  const photoIds = (photos || []).map((p: any) => p.id).filter(Boolean)
  let likeCounts: Record<string, number> = {}
  let userLikedPhotoIds: string[] = []

  if (photoIds.length > 0) {
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    const { data: countsData } = await supabase.rpc('get_photo_like_counts', { photo_ids: photoIds })
    if (countsData) {
      for (const row of countsData) {
        likeCounts[row.photo_id] = Number(row.like_count)
      }
    }
    if (currentUser) {
      const { data: userLikes } = await supabase
        .from('photo_likes')
        .select('photo_id')
        .eq('user_id', currentUser.id)
        .in('photo_id', photoIds)
      if (userLikes) {
        userLikedPhotoIds = userLikes.map((r: any) => r.photo_id)
      }
    }
  }

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const admin = createAdminClient()
  let collabModels: any[] = []

  const [{ data: collabAsSender }, { data: collabAsReceiver }] = await Promise.all([
    admin.from('model_collaborations').select('receiver_id').eq('sender_id', id).eq('status', 'accepted'),
    admin.from('model_collaborations').select('sender_id').eq('receiver_id', id).eq('status', 'accepted'),
  ])

  const partnerIds = [
    ...(collabAsSender || []).map((c: any) => c.receiver_id),
    ...(collabAsReceiver || []).map((c: any) => c.sender_id),
  ]

  if (partnerIds.length) {
    const [{ data: partnerProfiles }, { data: partnerDetails }, { data: partnerPhotos }] = await Promise.all([
      admin.from('profiles').select('id, username, is_verified').in('id', partnerIds).eq('is_blocked', false),
      admin.from('model_details').select('model_id, showname, city, age').in('model_id', partnerIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', partnerIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    ])

    const dMap = new Map((partnerDetails ?? []).map((d: any) => [d.model_id, d]))
    const pMap = new Map<string, string>()
    for (const p of partnerPhotos ?? []) {
      if (!pMap.has(p.model_id) && p.file_path) {
        pMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }

    collabModels = (partnerProfiles ?? []).map((p: any) => ({
      ...p,
      ...(dMap.get(p.id) || {}),
      photoUrl: pMap.get(p.id) || null,
    }))
  }

  // Same ~2h freshness rule as homepage: stale GPS is not shown publicly
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000
  let modelDetailsForClient = modelDetails
  if (modelDetailsForClient) {
    const md = { ...modelDetailsForClient }
    if (md.share_live_location && md.live_location_updated_at) {
      const age = Date.now() - new Date(md.live_location_updated_at).getTime()
      if (age > TWO_HOURS_MS) {
        md.live_location_city = null
        md.live_location_postal_code = null
      }
    }
    modelDetailsForClient = md
  }

  const { data: activeRows } = await supabase.rpc('models_with_active_ads')
  const hasActiveAd = !!(activeRows || []).find((r: { id: string }) => r.id === id)

  return {
    profile,
    modelDetails: modelDetailsForClient,
    photos:       photos        || [],
    videos:       videos        || [],
    rates:        rates         || [],
    services:     modelServices || [],
    languages:    languages     || [],
    workingHours: workingHours  || [],
    contactDetails,
    comments:     (comments || []).filter((c: any) => {
      const u = Array.isArray(c.user) ? c.user[0] : c.user
      return !u?.is_blocked
    }),
    collabModels,
    likeCounts,
    userLikedPhotoIds,
    hasActiveAd,
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
      .eq('is_blocked', false)
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
