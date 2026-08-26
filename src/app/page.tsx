import { unstable_cache } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MixedHomeClient from '@/components/home/MixedHomeClient'
import { resolveLiveLocationCanton } from '@/lib/live-location-canton'
import { fetchViewCounts } from '@/lib/viewCounts'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 60

export const metadata = buildMetadata({
  path: '/',
  title: 'NiceModels.ch – Das Erotikportal der Schweiz',
  description: 'NiceModels.ch – Das führende Erotikportal der Schweiz. Finde verifizierte Escort-Models, Clubs und Agenturen in Zürich, Bern, Basel, Genf und der ganzen Schweiz.',
})

const CACHE_TTL = 60

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

async function buildModels() {
  const admin = createAdminClient()
  const { data: modelsRaw } = await admin.rpc('models_with_active_ads')
  const modelsData: any[] = modelsRaw ?? []
  const modelIds: string[] = modelsData.map((m: any) => m.id)

  let models: any[] = []
  if (modelIds.length > 0) {
    const [{ data: allDetails }, { data: allServices }, { data: allPhotos }, { data: allProfiles }] = await Promise.all([
      admin.from('model_details')
        .select('model_id, showname, city, age, ethnicity, hair_color, about_me, services_for, share_live_location, live_location_city, live_location_postal_code, live_location_updated_at')
        .in('model_id', modelIds),
      admin.from('model_services')
        .select('model_id, services(id, name)')
        .in('model_id', modelIds),
      admin.from('model_photos')
        .select('model_id, file_path')
        .in('model_id', modelIds)
        .eq('is_approved', true)
        .order('model_id')
        .order('display_order', { ascending: true })
        .order('uploaded_at', { ascending: false }),
      // models_with_active_ads doesn't return is_verified — fetch it directly.
      admin.from('profiles').select('id, is_verified').in('id', modelIds),
    ])
    const verifiedMap = new Map(
      (allProfiles ?? []).map((p: { id: string; is_verified: boolean }) => [p.id, p.is_verified]),
    )

    const TWO_HOURS = 2 * 60 * 60 * 1000
    const detailsMap = new Map<string, any>()
    for (const d of allDetails ?? []) {
      if (d.share_live_location && d.live_location_updated_at) {
        const age = Date.now() - new Date(d.live_location_updated_at).getTime()
        if (age > TWO_HOURS) {
          d.live_location_city = null
          d.live_location_postal_code = null
        }
      }
      detailsMap.set(d.model_id, d)
    }
    const servicesMap = new Map<string, any[]>()
    for (const s of allServices ?? []) {
      if (!servicesMap.has(s.model_id)) servicesMap.set(s.model_id, [])
      if (s.services) servicesMap.get(s.model_id)!.push(s.services)
    }
    const photosMap = new Map<string, string>()
    for (const p of allPhotos ?? []) {
      if (!photosMap.has(p.model_id) && p.file_path)
        photosMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
    }

    models = modelsData.map((m: any) => ({
      ...m,
      model_details: detailsMap.get(m.id) ?? null,
      model_services_list: servicesMap.get(m.id) ?? [],
      photoUrl: photosMap.get(m.id) ?? null,
      is_verified: verifiedMap.get(m.id) ?? false,
    }))

    const modelCityNames = [...new Set(
      models.map((m: any) => m.model_details?.city).filter(Boolean),
    )] as string[]

    const liveCityNames = [...new Set(
      models.map((m: any) => m.model_details?.live_location_city).filter(Boolean),
    )] as string[]

    const uniqCityNames = [...new Set([...modelCityNames, ...liveCityNames])]
    const liveSet = new Set(liveCityNames)
    const profileCitySet = new Set(modelCityNames)

    const [{ data: cityRowsUnified }, modelViewCountMap] = await Promise.all([
      uniqCityNames.length > 0
        ? admin
            .from('cities')
            .select('name, postal_code, canton')
            .in('name', uniqCityNames)
            .eq('is_active', true)
        : Promise.resolve({ data: [] as { name: string; postal_code: string | null; canton: string | null }[] }),
      fetchViewCounts(admin, 'model', modelIds),
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

    models = models.map((m: any) => ({
      ...m,
      canton: m.model_details?.city ? cityCantonMap.get(m.model_details.city) || null : null,
      live_location_canton: resolveLiveLocationCanton(
        m.model_details?.live_location_city,
        m.model_details?.live_location_postal_code,
        liveCityRows,
      ),
      view_count: modelViewCountMap.get(m.id) ?? 0,
    }))
  }
  return models
}

async function buildClubs() {
  const admin = createAdminClient()
  const { data: clubsRaw } = await admin.rpc('clubs_with_active_ads')
  let clubs: any[] = []
  if (clubsRaw?.length) {
    const clubIds = clubsRaw.map((c: any) => c.id)
    const [{ data: clubDetails }, { data: clubContacts }, { data: clubPhotos }] = await Promise.all([
      admin.from('club_details').select('club_id, display_name, club_name, is_club, area, about_description').in('club_id', clubIds),
      admin.from('club_contact_details').select('club_id, city').in('club_id', clubIds),
      admin.from('club_photos').select('club_id, file_path').in('club_id', clubIds).eq('is_approved', true).order('club_id').order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
    ])

    const detMap = new Map((clubDetails || []).map(d => [d.club_id, d]))
    const contactMap = new Map((clubContacts || []).map(c => [c.club_id, c]))
    const photoMap = new Map<string, string>()
    for (const p of clubPhotos || []) {
      if (!photoMap.has(p.club_id) && p.file_path)
        photoMap.set(p.club_id, `${SUPA_URL}/storage/v1/object/public/club-photos/${p.file_path}`)
    }

    clubs = clubsRaw.map((c: any) => {
      const det = detMap.get(c.id)
      const con = contactMap.get(c.id)
      return {
        id: c.id,
        display_name: det?.display_name || c.display_name || c.club_name || '',
        area: det?.area || c.area || '',
        city: con?.city || '',
        is_club: det?.is_club ?? c.is_club ?? true,
        description: det?.about_description || '',
        photoUrl: photoMap.get(c.id) || null,
      }
    })

    const clubCityNames = [...new Set(
      clubs.map((c: any) => c.city).filter(Boolean)
    )] as string[]

    if (clubCityNames.length > 0) {
      const { data: clubCityCantonsData } = await admin
        .from('cities')
        .select('name, canton')
        .in('name', clubCityNames)
        .eq('is_active', true)

      const clubCityCantonMap = new Map<string, string>()
      for (const c of clubCityCantonsData || []) {
        if (c.name && c.canton && !clubCityCantonMap.has(c.name)) {
          clubCityCantonMap.set(c.name, c.canton)
        }
      }

      clubs = clubs.map((c: any) => ({
        ...c,
        canton: c.city ? clubCityCantonMap.get(c.city) || null : null,
      }))
    }

    const clubIds2 = clubs.map((c: any) => c.id)
    const clubViewCountMap = await fetchViewCounts(admin, 'club', clubIds2)
    clubs = clubs.map((c: any) => ({ ...c, view_count: clubViewCountMap.get(c.id) ?? 0 }))
  }
  return clubs
}

async function buildBanners() {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { data: bannersRaw } = await admin.from('banners').select('*')
    .eq('status', 'active')
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('display_order')

  const bannerOwnerIds = [...new Set((bannersRaw ?? []).map((b: any) => b.owner_id).filter(Boolean))]
  let blockedOwnerIds = new Set<string>()
  if (bannerOwnerIds.length > 0) {
    const { data: ownerProfiles } = await admin
      .from('profiles')
      .select('id, is_blocked')
      .in('id', bannerOwnerIds)
    blockedOwnerIds = new Set((ownerProfiles ?? []).filter(p => p.is_blocked).map(p => p.id))
  }

  const seenOwners = new Set<string>()
  return (bannersRaw ?? [])
    .filter((b: any) => !blockedOwnerIds.has(b.owner_id))
    .filter((b: any) => { if (seenOwners.has(b.owner_id)) return false; seenOwners.add(b.owner_id); return true })
    .map((b: any) => ({
      id: b.id, owner_type: b.owner_type, owner_id: b.owner_id, title: b.title,
      image_url: b.image_path ? `${SUPA_URL}/storage/v1/object/public/banners/${b.image_path}` : null,
      cta_url: b.cta_url,
      placement: b.placement,
      target_cantons: b.target_cantons ?? null,
    }))
}

async function buildListings() {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { data: listingsRaw } = await admin.from('job_listings')
    .select('id, listing_type, title, location, club_id, created_at, description, country_code, phone_number, has_whatsapp, has_viber, has_telegram, email, website')
    .eq('status', 'active')
    .eq('is_blocked', false)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })

  let listings: any[] = []
  if (listingsRaw?.length) {
    const listingIds = listingsRaw.map(l => l.id)
    const listingClubIds = [...new Set(listingsRaw.map(l => l.club_id).filter(Boolean))]

    const [{ data: listingPhotos }, { data: listingProfiles }] = await Promise.all([
      admin.from('job_listing_photos').select('listing_id, file_path').in('listing_id', listingIds).order('display_order'),
      listingClubIds.length > 0
        ? admin.from('profiles').select('id, username').in('id', listingClubIds)
        : Promise.resolve({ data: [] as { id: string; username: string }[] }),
    ])

    const lPhotoMap = new Map<string, string>()
    for (const p of listingPhotos || []) {
      if (!lPhotoMap.has(p.listing_id) && p.file_path)
        lPhotoMap.set(p.listing_id, `${SUPA_URL}/storage/v1/object/public/job-listing-photos/${p.file_path}`)
    }
    const lProfileMap = new Map((listingProfiles || []).map(p => [p.id, p.username]))

    listings = listingsRaw.map(l => ({
      id: l.id,
      listing_type: l.listing_type,
      title: l.title,
      location: l.location,
      description: l.description || '',
      country_code: l.country_code || null,
      phone_number: l.phone_number || null,
      has_whatsapp: l.has_whatsapp || false,
      has_viber: l.has_viber || false,
      has_telegram: l.has_telegram || false,
      email: l.email || null,
      website: l.website || null,
      created_at: l.created_at,
      club_id: l.club_id,
      photoUrl: lPhotoMap.get(l.id) || null,
      club_name: lProfileMap.get(l.club_id) || '',
    }))
  }
  return listings
}

async function buildStatusMessages() {
  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { data: statusRaw } = await admin.from('model_status_messages')
    .select('id, model_id, message, created_at')
    .eq('is_active', true).gt('expires_at', now)
    .order('created_at', { ascending: false }).limit(50)

  let statusMessages: any[] = []
  if (statusRaw?.length) {
    const msgIds = [...new Set(statusRaw.map(s => s.model_id))]
    const [{ data: p1 }, { data: d1 }, { data: ph1 }] = await Promise.all([
      admin.from('profiles').select('id, username').in('id', msgIds).eq('is_blocked', false),
      admin.from('model_details').select('model_id, showname, sedcard_visible').in('model_id', msgIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', msgIds)
        .eq('is_approved', true).order('model_id').order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
    ])
    const pMap = new Map((p1 || []).map(x => [x.id, x]))
    const dMap = new Map((d1 || []).map(x => [x.model_id, x]))
    const phMap = new Map<string, string>()
    for (const p of ph1 || []) { if (!phMap.has(p.model_id) && p.file_path) phMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`) }
    statusMessages = statusRaw.filter(s => {
      if (!pMap.has(s.model_id)) return false
      const det = dMap.get(s.model_id) as { sedcard_visible?: boolean } | undefined
      return det?.sedcard_visible !== false
    }).map(s => ({
      id: s.id, model_id: s.model_id, caption: s.message, created_at: s.created_at,
      model_name: dMap.get(s.model_id)?.showname || pMap.get(s.model_id)?.username || 'Model',
      model_photo: phMap.get(s.model_id) || null,
    }))
  }
  return statusMessages
}

async function buildStories() {
  const admin = createAdminClient()
  const { data } = await admin.rpc('get_active_model_stories')
  const rows = (data ?? []) as any[]
  if (!rows.length) return rows

  // Exclude models who have toggled their sedcard off.
  const ids = [...new Set(rows.map(r => r.model_id).filter(Boolean))]
  if (!ids.length) return rows
  const { data: visRows } = await admin
    .from('model_details')
    .select('model_id, sedcard_visible')
    .in('model_id', ids)
  const hiddenIds = new Set(
    (visRows || [])
      .filter((r: { sedcard_visible?: boolean }) => r.sedcard_visible === false)
      .map((r: { model_id: string }) => r.model_id)
  )
  return rows.filter(r => !hiddenIds.has(r.model_id))
}

async function buildChatModels() {
  const admin = createAdminClient()
  const { data: chatRaw } = await admin.from('model_details')
    .select('model_id, showname, city')
    .eq('chat_available', true)
    .eq('sedcard_visible', true)
    .limit(10)

  let chatModels: any[] = []
  if (chatRaw?.length) {
    const cIds = chatRaw.map(m => m.model_id)
    const [{ data: cp }, { data: cph }] = await Promise.all([
      admin.from('profiles').select('id, username').in('id', cIds).eq('is_blocked', false),
      admin.from('model_photos').select('model_id, file_path').in('model_id', cIds)
        .eq('is_approved', true).order('model_id').order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
    ])
    const cpMap = new Map((cp || []).map(x => [x.id, x]))
    const cphMap = new Map<string, string>()
    for (const p of cph || []) { if (!cphMap.has(p.model_id) && p.file_path) cphMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`) }
    chatModels = chatRaw.filter(m => cpMap.has(m.model_id)).map(m => ({
      id: m.model_id, model_name: m.showname || cpMap.get(m.model_id)?.username || 'Model',
      city: m.city || null, model_photo: cphMap.get(m.model_id) || null,
    }))
  }
  return chatModels
}

const getModels = unstable_cache(buildModels, ['home-models-v1'], { revalidate: CACHE_TTL, tags: ['home-models'] })
const getClubs = unstable_cache(buildClubs, ['home-clubs-v1'], { revalidate: CACHE_TTL, tags: ['home-clubs'] })
const getBanners = unstable_cache(buildBanners, ['home-banners-v1'], { revalidate: CACHE_TTL, tags: ['home-banners'] })
const getListings = unstable_cache(buildListings, ['home-listings-v1'], { revalidate: CACHE_TTL, tags: ['home-listings'] })
const getStatusMessages = unstable_cache(buildStatusMessages, ['home-status-v1'], { revalidate: CACHE_TTL, tags: ['home-status'] })
const getChatModels = unstable_cache(buildChatModels, ['home-chat-v1'], { revalidate: CACHE_TTL, tags: ['home-chat'] })
const getStories = unstable_cache(buildStories, ['home-stories-v1'], { revalidate: CACHE_TTL, tags: ['home-stories'] })

export default async function HomePage() {
  const [models, clubs, banners, listings, statusMessages, chatModels, stories, t] = await Promise.all([
    getModels(),
    getClubs(),
    getBanners(),
    getListings(),
    getStatusMessages(),
    getChatModels(),
    getStories(),
    getTranslations('home.seo'),
  ])

  // Per-request seed: rotates the feed each load while keeping SSR and the
  // hydrated client order identical (deterministic seeded shuffle), so cards
  // never jump under the user's finger after hydration.
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0

  const hero = (
    <div className="rounded-xl bg-white/70 px-4 py-3 sm:px-5 sm:py-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
        {t('homeH1')}
      </h1>
    </div>
  )

  return (
    <MixedHomeClient
      models={models}
      clubs={clubs}
      banners={banners}
      listings={listings}
      statusMessages={statusMessages}
      chatModels={chatModels}
      stories={stories}
      seed={seed}
      hero={hero}
    />
  )
}
