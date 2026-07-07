import type { SupabaseClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import HomePageClient from '@/components/home/HomePageClient'
import { resolveLiveLocationCanton } from '@/lib/live-location-canton'
import { fetchViewCounts } from '@/lib/viewCounts'
import { buildMetadata } from '@/lib/seo'

const CACHE_TTL = 60

export const metadata = buildMetadata({
  path: '/models-page',
  title: 'Escort-Models in der Schweiz – Verifizierte Begleitung',
  description: 'Entdecke verifizierte Escort-Models in der ganzen Schweiz auf NiceModels.ch. Zürich, Bern, Basel, Genf und mehr – jetzt Profile entdecken.',
})

async function loadBanners(
  admin: SupabaseClient,
  SUPA_URL: string,
  now: string,
) {
  const { data: bannersRaw } = await admin
    .from('banners')
    .select(
      'id, owner_type, owner_id, title, image_path, cta_url, placement, target_cantons',
    )
    .eq('status', 'active')
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('display_order')

  const bannerOwnerIds = [...new Set((bannersRaw ?? []).map((b: { owner_id?: string }) => b.owner_id).filter(Boolean))]
  let blockedBannerOwners = new Set<string>()
  if (bannerOwnerIds.length > 0) {
    const { data: ownerProfiles } = await admin
      .from('profiles')
      .select('id, is_blocked')
      .in('id', bannerOwnerIds)
    blockedBannerOwners = new Set((ownerProfiles ?? []).filter(p => p.is_blocked).map(p => p.id))
  }

  const seenOwners = new Set<string>()
  return (bannersRaw ?? [])
    .filter((b: { owner_id: string }) => !blockedBannerOwners.has(b.owner_id))
    .filter((b: { owner_id: string }) => {
      if (seenOwners.has(b.owner_id)) return false
      seenOwners.add(b.owner_id)
      return true
    })
    .map((b: {
      id: string
      owner_type: string
      owner_id: string
      title: string | null
      image_path: string | null
      cta_url: string | null
      placement: string | null
      target_cantons: unknown
    }) => ({
      id: b.id,
      owner_type: b.owner_type,
      owner_id: b.owner_id,
      title: b.title,
      image_url: b.image_path ? `${SUPA_URL}/storage/v1/object/public/banners/${b.image_path}` : null,
      cta_url: b.cta_url,
      placement: b.placement,
      target_cantons: b.target_cantons ?? null,
    }))
}

async function loadStatusMessages(admin: SupabaseClient, SUPA_URL: string, now: string) {
  const { data: statusRaw } = await admin
    .from('model_status_messages')
    .select('id, model_id, message, created_at')
    .eq('is_active', true)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!statusRaw?.length) return []

  const msgModelIds = [...new Set(statusRaw.map(s => s.model_id))]
  const [{ data: msgProfiles }, { data: msgDetails }, { data: msgPhotos }] = await Promise.all([
    admin.from('profiles').select('id, username').in('id', msgModelIds).eq('is_blocked', false),
    admin.from('model_details').select('model_id, showname').in('model_id', msgModelIds),
    admin.from('model_photos').select('model_id, file_path').in('model_id', msgModelIds)
      .eq('is_approved', true).order('model_id').order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
  ])

  const profMap = new Map((msgProfiles || []).map(p => [p.id, p]))
  const detMap = new Map((msgDetails || []).map(d => [d.model_id, d]))
  const photoMap = new Map<string, string>()
  for (const p of msgPhotos || []) {
    if (!photoMap.has(p.model_id) && p.file_path) {
      photoMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
    }
  }

  return statusRaw.filter(s => profMap.has(s.model_id)).map(s => ({
    id: s.id,
    model_id: s.model_id,
    caption: s.message,
    created_at: s.created_at,
    model_name: detMap.get(s.model_id)?.showname || profMap.get(s.model_id)?.username || 'Model',
    model_photo: photoMap.get(s.model_id) || null,
  }))
}

async function loadChatModels(admin: SupabaseClient, SUPA_URL: string) {
  const { data: chatRaw } = await admin
    .from('model_details')
    .select('model_id, showname, city')
    .eq('chat_available', true)
    .limit(10)

  if (!chatRaw?.length) return []

  const chatModelIds = chatRaw.map(m => m.model_id)
  const [{ data: chatProfiles }, { data: chatPhotos }] = await Promise.all([
    admin.from('profiles').select('id, username').in('id', chatModelIds).eq('is_blocked', false),
    admin.from('model_photos').select('model_id, file_path').in('model_id', chatModelIds)
      .eq('is_approved', true).order('model_id').order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
  ])
  const cpMap = new Map((chatProfiles || []).map(p => [p.id, p]))
  const photoMapChat = new Map<string, string>()
  for (const p of chatPhotos || []) {
    if (!photoMapChat.has(p.model_id) && p.file_path) {
      photoMapChat.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
    }
  }
  return chatRaw.filter(m => cpMap.has(m.model_id)).map(m => ({
    id: m.model_id,
    model_name: m.showname || cpMap.get(m.model_id)?.username || 'Model',
    city: m.city || null,
    model_photo: photoMapChat.get(m.model_id) || null,
  }))
}

async function loadStories(admin: SupabaseClient) {
  const { data } = await admin.rpc('get_active_model_stories')
  const rows = (data ?? []) as any[]
  if (!rows.length) return rows
  // Exclude models who have toggled their sedcard off (mirror homepage).
  const ids = [...new Set(rows.map(r => r.model_id).filter(Boolean))]
  if (!ids.length) return rows
  const { data: visRows } = await admin
    .from('model_details')
    .select('model_id, sedcard_visible')
    .in('model_id', ids)
  const hiddenIds = new Set(
    (visRows || [])
      .filter((r: { sedcard_visible?: boolean }) => r.sedcard_visible === false)
      .map((r: { model_id: string }) => r.model_id),
  )
  return rows.filter(r => !hiddenIds.has(r.model_id))
}

async function buildModelsPageData() {
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const now = new Date().toISOString()

  const bannersP = loadBanners(admin, SUPA_URL, now)
  const statusP = loadStatusMessages(admin, SUPA_URL, now)
  const chatP = loadChatModels(admin, SUPA_URL)
  const storiesP = loadStories(admin)

  const { data: modelsRaw } = await admin.rpc('models_with_active_ads')
  const modelsData: Record<string, unknown>[] = modelsRaw ?? []
  const modelIds = modelsData.map(m => (m as { id: string }).id)

  let models: Record<string, unknown>[] = []

  if (modelIds.length > 0) {
    const [
      { data: allDetails },
      { data: allServices },
      { data: allPhotos },
    ] = await Promise.all([
      admin
        .from('model_details')
        .select('model_id, showname, city, age, ethnicity, hair_color, about_me, services_for, share_live_location, live_location_city, live_location_postal_code, live_location_updated_at')
        .in('model_id', modelIds),
      admin
        .from('model_services')
        .select('model_id, services(id, name)')
        .in('model_id', modelIds),
      admin
        .from('model_photos')
        .select('model_id, file_path')
        .in('model_id', modelIds)
        .eq('is_approved', true)
        .order('model_id')
        .order('display_order', { ascending: true })
        .order('uploaded_at', { ascending: false }),
    ])

    const TWO_HOURS = 2 * 60 * 60 * 1000
    const detailsMap = new Map<string, Record<string, unknown>>()
    for (const d of allDetails ?? []) {
      const row = d as Record<string, unknown> & {
        model_id: string
        live_location_city: string | null
        live_location_postal_code: string | null
        live_location_updated_at: string | null
        share_live_location: boolean
      }
      if (row.share_live_location && row.live_location_updated_at) {
        const age = Date.now() - new Date(row.live_location_updated_at).getTime()
        if (age > TWO_HOURS) {
          row.live_location_city = null
          row.live_location_postal_code = null
        }
      }
      detailsMap.set(row.model_id, row)
    }

    const servicesMap = new Map<string, unknown[]>()
    for (const s of allServices ?? []) {
      const row = s as { model_id: string; services?: unknown }
      if (!servicesMap.has(row.model_id)) servicesMap.set(row.model_id, [])
      if (row.services) servicesMap.get(row.model_id)!.push(row.services)
    }

    const photosMap = new Map<string, string>()
    for (const p of allPhotos ?? []) {
      const row = p as { model_id: string; file_path: string | null }
      if (!photosMap.has(row.model_id) && row.file_path) {
        photosMap.set(row.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${row.file_path}`)
      }
    }

    models = modelsData.map(model => ({
      ...(model as Record<string, unknown>),
      model_details: detailsMap.get((model as { id: string }).id) ?? null,
      model_services_list: servicesMap.get((model as { id: string }).id) ?? [],
      photoUrl: photosMap.get((model as { id: string }).id) ?? null,
    }))

    const modelCityNames = [...new Set(
      models.map(m => (m.model_details as { city?: string } | null)?.city).filter(Boolean),
    )] as string[]

    const liveCityNames = [...new Set(
      models.map(m => (m.model_details as { live_location_city?: string } | null)?.live_location_city).filter(Boolean),
    )] as string[]

    const uniqCityNames = [...new Set([...modelCityNames, ...liveCityNames])]
    const liveSet = new Set(liveCityNames)
    const profileCitySet = new Set(modelCityNames)

    const [
      { data: cityRowsUnified },
      viewCountMap,
      banners,
      statusMessages,
      chatModels,
      stories,
    ] = await Promise.all([
      uniqCityNames.length > 0
        ? admin
            .from('cities')
            .select('name, postal_code, canton')
            .in('name', uniqCityNames)
            .eq('is_active', true)
        : Promise.resolve({ data: [] as { name: string; postal_code: string | null; canton: string | null }[] }),
      fetchViewCounts(admin, 'model', modelIds),
      bannersP,
      statusP,
      chatP,
      storiesP,
    ])

    const cityCantonMap = new Map<string, string>()
    const liveCityRows: { name: string; postal_code: string | null; canton: string | null }[] = []
    for (const c of cityRowsUnified || []) {
      if (!c.name) continue
      if (profileCitySet.has(c.name) && c.canton && !cityCantonMap.has(c.name)) {
        cityCantonMap.set(c.name, c.canton)
      }
      if (liveSet.has(c.name)) {
        liveCityRows.push({
          name: c.name,
          postal_code: c.postal_code,
          canton: c.canton,
        })
      }
    }

    models = models.map(m => {
      const details = m.model_details as {
        city?: string | null
        live_location_city?: string | null
        live_location_postal_code?: string | null
      } | null
      return {
        ...m,
        canton: details?.city ? cityCantonMap.get(details.city) || null : null,
        live_location_canton: resolveLiveLocationCanton(
          details?.live_location_city,
          details?.live_location_postal_code,
          liveCityRows,
        ),
        view_count: viewCountMap.get((m as { id: string }).id) ?? 0,
      }
    })

    return { models, banners, statusMessages, chatModels, stories }
  }

  const [banners, statusMessages, chatModels, stories] = await Promise.all([bannersP, statusP, chatP, storiesP])

  return { models, banners, statusMessages, chatModels, stories }
}

// Cached, admin-only data load (no per-request cookies) so the models listing
// is served from cache for 60s instead of doing the full Supabase work on every
// request. Mirrors the homepage caching strategy.
const getModelsPageData = unstable_cache(
  buildModelsPageData,
  ['models-page-data-v1'],
  { revalidate: CACHE_TTL, tags: ['models-page'] },
)

export default async function ModelsPage() {
  const [{ models, banners, statusMessages, chatModels, stories }, t] = await Promise.all([
    getModelsPageData(),
    getTranslations('home.seo'),
  ])

  const hero = (
    <div className="rounded-xl bg-white/70 px-4 py-3 sm:px-5 sm:py-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
        {t('modelsH1')}
      </h1>
      <p className="mt-1 text-sm font-medium text-gray-700 leading-relaxed">
        {t('modelsIntro')}
      </p>
      <p className="mt-1 text-xs text-gray-500 leading-relaxed">
        {t('modelsBody')}
      </p>
    </div>
  )

  return (
    <HomePageClient
      initialModels={models as any}
      initialBanners={banners as any}
      statusMessages={statusMessages as any}
      chatModels={chatModels as any}
      stories={stories as any}
      hero={hero}
    />
  )
}
