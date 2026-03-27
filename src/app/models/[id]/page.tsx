import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ModelProfileClient from './ModelProfileClient'

interface ModelPageProps {
  params: Promise<{ id: string }>
}

const getModelMeta = cache(async (id: string) => {
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const [{ data: details }, { data: photo }] = await Promise.all([
    admin
      .from('model_details')
      .select('showname, city, age, about_me')
      .eq('model_id', id)
      .single(),
    admin
      .from('model_photos')
      .select('file_path')
      .eq('model_id', id)
      .eq('is_approved', true)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  return { details, photo, SUPA_URL }
})

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { id } = await params
  const { details, photo, SUPA_URL } = await getModelMeta(id)

  if (!details) return { title: 'Model nicht gefunden' }

  const name = details.showname || 'Model'
  const city = details.city || 'Schweiz'
  const title = `${name} – Escort in ${city}`
  const desc =
    details.about_me?.replace(/<[^>]*>/g, '').slice(0, 155).trimEnd() ||
    `${name} – Verifiziertes Escort-Model in ${city}. Jetzt Profil ansehen auf NiceModels.ch`

  const ogImage = photo?.file_path
    ? `${SUPA_URL}/storage/v1/object/public/model-photos/${photo.file_path}`
    : '/logo.webp'

  return {
    title,
    description: desc,
    openGraph: {
      title, description: desc, type: 'profile',
      images: [{ url: ogImage, alt: name }],
    },
    twitter: {
      card: 'summary_large_image', title, description: desc, images: [ogImage],
    },
    alternates: { canonical: `https://www.nicemodels.ch/models/${id}` },
  }
}

let _idsCache: { ids: string[]; at: number } | null = null
const IDS_TTL = 60_000

async function getCachedAllModelIds(): Promise<string[]> {
  if (_idsCache && Date.now() - _idsCache.at < IDS_TTL) return _idsCache.ids
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('models_with_active_ads')
  let ids: string[]
  if (error || !data?.length) {
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
  const supabase = await createClient()
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  // ── Stage 1: ALL independent queries in a single parallel batch ──
  const [
    { data: profile },
    { data: modelDetails },
    { data: photos },
    { data: videos },
    { data: rates },
    { data: modelServices },
    { data: languages },
    { data: workingHours },
    { data: contactDetails },
    { data: comments },
    { data: collabAsSender },
    { data: collabAsReceiver },
    allModelIds,
    currentUser,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).eq('role', 'model').single(),
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
      .select('id, comment_text, rating, created_at, reply_text, replied_at, user:profiles!model_comments_user_id_fkey(id, username)')
      .eq('model_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    admin.from('model_collaborations').select('receiver_id').eq('sender_id', id).eq('status', 'accepted'),
    admin.from('model_collaborations').select('sender_id').eq('receiver_id', id).eq('status', 'accepted'),
    getCachedAllModelIds(),
    supabase.auth.getUser().then(r => r.data.user),
  ])

  if (!profile) notFound()

  // ── Stage 2: Photo likes + collab details (parallel) ──
  const photoIds = (photos || []).map((p: any) => p.id).filter(Boolean)
  const partnerIds = [
    ...(collabAsSender || []).map((c: any) => c.receiver_id),
    ...(collabAsReceiver || []).map((c: any) => c.sender_id),
  ]

  const likesPromise = photoIds.length > 0
    ? Promise.all([
        supabase.rpc('get_photo_like_counts', { photo_ids: photoIds }),
        currentUser
          ? supabase.from('photo_likes').select('photo_id').eq('user_id', currentUser.id).in('photo_id', photoIds)
          : Promise.resolve({ data: [] }),
      ])
    : Promise.resolve([{ data: null }, { data: [] }])

  const collabPromise = partnerIds.length > 0
    ? Promise.all([
        admin.from('profiles').select('id, username, is_verified').in('id', partnerIds),
        admin.from('model_details').select('model_id, showname, city, age').in('model_id', partnerIds),
        admin.from('model_photos').select('model_id, file_path').in('model_id', partnerIds)
          .eq('is_approved', true).order('uploaded_at', { ascending: false }),
      ])
    : Promise.resolve([{ data: [] }, { data: [] }, { data: [] }])

  const [likesResult, collabResult] = await Promise.all([likesPromise, collabPromise])

  // Process likes
  let likeCounts: Record<string, number> = {}
  let userLikedPhotoIds: string[] = []
  const [countsRes, userLikesRes] = likesResult as any
  if (countsRes?.data) {
    for (const row of countsRes.data) {
      likeCounts[row.photo_id] = Number(row.like_count)
    }
  }
  if (userLikesRes?.data) {
    userLikedPhotoIds = userLikesRes.data.map((r: any) => r.photo_id)
  }

  // Process collaborations
  let collabModels: any[] = []
  if (partnerIds.length > 0) {
    const [{ data: partnerProfiles }, { data: partnerDetails }, { data: partnerPhotos }] = collabResult as any

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

  // Live location freshness
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

  const total = allModelIds.length
  const currentIndex = allModelIds.indexOf(id)
  const prevId = total > 1 ? allModelIds[(currentIndex - 1 + total) % total] : null
  const nextId = total > 1 ? allModelIds[(currentIndex + 1) % total] : null

  return (
    <>
      <Navbar />
      <ModelProfileClient
        modelData={{
          profile,
          modelDetails: modelDetailsForClient,
          photos: photos || [],
          videos: videos || [],
          rates: rates || [],
          services: modelServices || [],
          languages: languages || [],
          workingHours: workingHours || [],
          contactDetails,
          comments: comments || [],
          collabModels,
          likeCounts,
          userLikedPhotoIds,
        }}
        allModelIds={allModelIds}
        prevId={prevId}
        nextId={nextId}
      />
      <Footer />
    </>
  )
}
