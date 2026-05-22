import type { Metadata } from 'next'
import { cache } from 'react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EyeOff } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ModelProfileClient from './ModelProfileClient'
import { fetchViewCounts } from '@/lib/viewCounts'

async function UnavailableSedcard({ showname }: { showname: string | null }) {
  const t = await getTranslations('models.profile.unavailable')
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gray-50">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-gray-100 flex items-center justify-center">
          <EyeOff className="w-7 h-7 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {showname ? t('titleNamed', { name: showname }) : t('title')}
        </h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{t('body')}</p>
        <Link
          href="/models-page"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-hover transition-colors"
        >
          {t('browseOthers')}
        </Link>
      </div>
    </main>
  )
}

const SITE_URL = 'https://www.nicemodels.ch'

interface ModelPageProps {
  params: Promise<{ id: string }>
}

const getModelMeta = cache(async (id: string) => {
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const { data: profile } = await admin
    .from('profiles')
    .select('id, username, is_blocked, role, is_verified')
    .eq('id', id)
    .eq('role', 'model')
    .eq('is_blocked', false)
    .maybeSingle()

  if (!profile) return null

  const [{ data: details }, { data: photo }] = await Promise.all([
    admin
      .from('model_details')
      .select('showname, city, age, ethnicity, hair_color, about_me, sedcard_visible')
      .eq('model_id', id)
      .maybeSingle(),
    admin
      .from('model_photos')
      .select('file_path')
      .eq('model_id', id)
      .eq('is_approved', true)
      .order('display_order', { ascending: true })
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return { profile, details, photo, SUPA_URL }
})

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { id } = await params
  const meta = await getModelMeta(id)
  if (!meta) return { title: 'Model nicht gefunden', robots: { index: false, follow: false } }

  const { profile, details, photo, SUPA_URL } = meta
  const name = details?.showname || profile.username || 'Model'
  const city = details?.city || 'Schweiz'
  const age = details?.age ? `, ${details.age}` : ''
  const title = `${name}${age} – Escort in ${city}`
  const desc =
    details?.about_me?.replace(/<[^>]*>/g, '').slice(0, 155).trimEnd()
    || `${name} – verifiziertes Escort-Model in ${city}. Profil, Fotos und Kontakt auf NiceModels.ch.`

  const ogImage = photo?.file_path
    ? `${SUPA_URL}/storage/v1/object/public/model-photos/${photo.file_path}`
    : `${SITE_URL}/logo.webp`

  // If the model has toggled their sedcard off, do not index this page.
  const isHidden = details?.sedcard_visible === false

  return {
    title,
    description: desc,
    ...(isHidden ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title, description: desc, type: 'profile',
      url: `${SITE_URL}/models/${id}`,
      images: [{ url: ogImage, alt: name }],
    },
    twitter: {
      card: 'summary_large_image', title, description: desc, images: [ogImage],
    },
    alternates: { canonical: `${SITE_URL}/models/${id}` },
  }
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

  // Early visibility gate: check if the model has toggled their sedcard off.
  // Owners and admins still see the full profile; everyone else gets the unavailable view.
  const [{ data: visibilityRow }, { data: { user: viewer } }] = await Promise.all([
    supabase.from('model_details').select('sedcard_visible, showname').eq('model_id', id).maybeSingle(),
    supabase.auth.getUser(),
  ])
  const sedcardVisible = visibilityRow?.sedcard_visible !== false
  const isOwner = viewer?.id === id
  let isAdmin = false
  if (viewer && !isOwner) {
    const { data: viewerProfile } = await supabase
      .from('profiles').select('role').eq('id', viewer.id).maybeSingle()
    isAdmin = viewerProfile?.role === 'admin'
  }
  if (!sedcardVisible && !isOwner && !isAdmin) {
    return {
      unavailable: true as const,
      profile,
      showname: visibilityRow?.showname || (profile as { username?: string }).username || null,
    }
  }

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
    supabase.from('model_photos').select('*').eq('model_id', id).eq('is_approved', true).order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
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
      .in('status', ['approved', 'reviewed'])
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
        .eq('is_approved', true).order('model_id').order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
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

  const viewCountMap = await fetchViewCounts(admin, 'model', [id])
  const viewCount = viewCountMap.get(id) ?? 0

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
    viewCount,
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

  // Sedcard has been toggled OFF by the model — show a placeholder instead
  // of the full profile. Owners/admins never hit this branch (handled inside getModelData).
  if ('unavailable' in modelData && modelData.unavailable) {
    return (
      <>
        <Navbar />
        <UnavailableSedcard showname={modelData.showname} />
        <Footer />
      </>
    )
  }

  const total        = allModelIds.length
  const currentIndex = allModelIds.indexOf(id)
  const prevId = total > 1 ? allModelIds[(currentIndex - 1 + total) % total] : null
  const nextId = total > 1 ? allModelIds[(currentIndex + 1) % total]         : null

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const md = modelData.modelDetails as { showname?: string; city?: string; age?: number | null; about_me?: string | null } | null
  const personName = md?.showname || (modelData.profile as { username?: string }).username || 'Model'
  const personImage = (modelData.photos as { file_path?: string }[])?.[0]?.file_path
    ? `${SUPA_URL}/storage/v1/object/public/model-photos/${(modelData.photos as { file_path?: string }[])[0].file_path}`
    : `${SITE_URL}/logo.webp`
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personName,
    url: `${SITE_URL}/models/${id}`,
    image: personImage,
    ...(md?.about_me ? { description: md.about_me.replace(/<[^>]*>/g, '').slice(0, 300) } : {}),
    ...(md?.city ? { address: { '@type': 'PostalAddress', addressLocality: md.city, addressCountry: 'CH' } } : {}),
  }

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
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
