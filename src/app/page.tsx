import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MixedHomeClient from '@/components/home/MixedHomeClient'
import { resolveLiveLocationCanton } from '@/lib/live-location-canton'
import { normalizePlacement } from '@/lib/bannerPlacement'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const now = new Date().toISOString()

  // ── Stage 1: ALL independent top-level queries in parallel ──
  const [
    { data: modelsRaw },
    { data: clubsRaw },
    { data: bannersRaw },
    { data: listingsRaw },
    { data: statusRaw },
    { data: chatRaw },
  ] = await Promise.all([
    supabase.rpc('models_with_active_ads'),
    supabase.rpc('clubs_with_active_ads'),
    supabase.from('banners').select('*')
      .eq('status', 'active')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('display_order'),
    supabase.from('job_listings')
      .select('id, listing_type, title, location, club_id, created_at, description, country_code, phone_number, has_whatsapp, has_viber, has_telegram, email, website')
      .eq('status', 'active').eq('is_blocked', false)
      .order('created_at', { ascending: false }),
    admin.from('model_status_messages')
      .select('id, model_id, message, created_at')
      .eq('is_active', true).gt('expires_at', now)
      .order('created_at', { ascending: false }).limit(50),
    admin.from('model_details')
      .select('model_id, showname, city').eq('chat_available', true).limit(10),
  ])

  const modelsData: any[] = modelsRaw ?? []
  const modelIds = modelsData.map((m: any) => m.id)
  const clubIds = (clubsRaw ?? []).map((c: any) => c.id)
  const listingIds = (listingsRaw ?? []).map((l: any) => l.id)
  const listingClubIds = [...new Set((listingsRaw ?? []).map((l: any) => l.club_id).filter(Boolean))]
  const statusModelIds = [...new Set((statusRaw ?? []).map((s: any) => s.model_id))]
  const chatModelIds = (chatRaw ?? []).map((m: any) => m.model_id)

  // ── Stage 2: ALL detail queries in parallel (across all categories) ──
  const stage2: Promise<any>[] = []

  // Models (indices 0-2): use admin so RLS never hides other models' public listing
  // data when the request runs as a logged-in user (RPC already scoped IDs via active ads).
  if (modelIds.length > 0) {
    stage2.push(
      admin.from('model_details')
        .select('model_id, showname, city, age, ethnicity, hair_color, about_me, services_for, share_live_location, live_location_city, live_location_postal_code, live_location_updated_at')
        .in('model_id', modelIds),
      admin.from('model_services').select('model_id, services(id, name)').in('model_id', modelIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', modelIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    )
  } else {
    stage2.push(
      Promise.resolve({ data: [] }),
      Promise.resolve({ data: [] }),
      Promise.resolve({ data: [] }),
    )
  }

  // Clubs (indices 3-5)
  if (clubIds.length > 0) {
    stage2.push(
      supabase.from('club_details').select('club_id, display_name, club_name, is_club, area, about_description').in('club_id', clubIds),
      supabase.from('club_contact_details').select('club_id, city').in('club_id', clubIds),
      supabase.from('club_photos').select('club_id, file_path').in('club_id', clubIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: true }),
    )
  } else {
    stage2.push(
      Promise.resolve({ data: [] }),
      Promise.resolve({ data: [] }),
      Promise.resolve({ data: [] }),
    )
  }

  // Listings (indices 6-7)
  if (listingIds.length > 0) {
    stage2.push(
      supabase.from('job_listing_photos').select('listing_id, file_path').in('listing_id', listingIds).order('display_order'),
      listingClubIds.length > 0
        ? supabase.from('profiles').select('id, username').in('id', listingClubIds)
        : Promise.resolve({ data: [] }),
    )
  } else {
    stage2.push(Promise.resolve({ data: [] }), Promise.resolve({ data: [] }))
  }

  // Status messages (indices 8-10)
  if (statusModelIds.length > 0) {
    stage2.push(
      admin.from('profiles').select('id, username').in('id', statusModelIds),
      admin.from('model_details').select('model_id, showname').in('model_id', statusModelIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', statusModelIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    )
  } else {
    stage2.push(
      Promise.resolve({ data: [] }),
      Promise.resolve({ data: [] }),
      Promise.resolve({ data: [] }),
    )
  }

  // Chat models (indices 11-12)
  if (chatModelIds.length > 0) {
    stage2.push(
      admin.from('profiles').select('id, username').in('id', chatModelIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', chatModelIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    )
  } else {
    stage2.push(Promise.resolve({ data: [] }), Promise.resolve({ data: [] }))
  }

  const s2 = await Promise.all(stage2)

  const allDetails    = s2[0].data ?? []
  const allServices   = s2[1].data ?? []
  const allPhotos     = s2[2].data ?? []
  const clubDetails   = s2[3].data ?? []
  const clubContacts  = s2[4].data ?? []
  const clubPhotos    = s2[5].data ?? []
  const listingPhotos = s2[6].data ?? []
  const listingProfiles = s2[7].data ?? []
  const statusProfiles  = s2[8].data ?? []
  const statusDetails   = s2[9].data ?? []
  const statusPhotos    = s2[10].data ?? []
  const chatProfiles    = s2[11].data ?? []
  const chatPhotos      = s2[12].data ?? []

  // ── Process models ──
  const TWO_HOURS = 2 * 60 * 60 * 1000
  const detailsMap = new Map<string, any>()
  for (const d of allDetails) {
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
  for (const s of allServices) {
    if (!servicesMap.has(s.model_id)) servicesMap.set(s.model_id, [])
    if (s.services) servicesMap.get(s.model_id)!.push(s.services)
  }
  const photosMap = new Map<string, string>()
  for (const p of allPhotos) {
    if (!photosMap.has(p.model_id) && p.file_path)
      photosMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
  }

  let models = modelsData.map((m: any) => ({
    ...m,
    model_details: detailsMap.get(m.id) ?? null,
    model_services_list: servicesMap.get(m.id) ?? [],
    photoUrl: photosMap.get(m.id) ?? null,
  }))

  // ── Process clubs ──
  const detMap = new Map((clubDetails).map((d: any) => [d.club_id, d]))
  const contactMap = new Map((clubContacts).map((c: any) => [c.club_id, c]))
  const clubPhotoMap = new Map<string, string>()
  for (const p of clubPhotos) {
    if (!clubPhotoMap.has(p.club_id) && p.file_path)
      clubPhotoMap.set(p.club_id, `${SUPA_URL}/storage/v1/object/public/club-photos/${p.file_path}`)
  }

  let clubs = (clubsRaw ?? []).map((c: any) => {
    const det = detMap.get(c.id)
    const con = contactMap.get(c.id)
    return {
      id: c.id,
      display_name: det?.display_name || c.display_name || c.club_name || '',
      area: det?.area || c.area || '',
      city: con?.city || '',
      is_club: det?.is_club ?? c.is_club ?? true,
      description: det?.about_description || '',
      photoUrl: clubPhotoMap.get(c.id) || null,
    }
  })

  // ── Stage 3: All city/canton lookups in parallel ──
  const modelCityNames = [...new Set(models.map((m: any) => m.model_details?.city).filter(Boolean))] as string[]
  const liveCityNames = [...new Set(models.map((m: any) => m.model_details?.live_location_city).filter(Boolean))] as string[]
  const clubCityNames = [...new Set(clubs.map((c: any) => c.city).filter(Boolean))] as string[]
  const allCityNames = [...new Set([...modelCityNames, ...liveCityNames, ...clubCityNames])]

  let cityCantonMap = new Map<string, string>()
  let liveCityRows: { name: string; postal_code: string | null; canton: string | null }[] = []

  if (allCityNames.length > 0) {
    const { data: citiesData } = await supabase
      .from('cities')
      .select('name, postal_code, canton')
      .in('name', allCityNames)
      .eq('is_active', true)

    for (const c of citiesData || []) {
      if (c.name && c.canton && !cityCantonMap.has(c.name)) {
        cityCantonMap.set(c.name, c.canton)
      }
    }
    liveCityRows = (citiesData || []).filter(c => liveCityNames.includes(c.name))
  }

  models = models.map((m: any) => ({
    ...m,
    canton: m.model_details?.city ? cityCantonMap.get(m.model_details.city) || null : null,
    live_location_canton: resolveLiveLocationCanton(
      m.model_details?.live_location_city,
      m.model_details?.live_location_postal_code,
      liveCityRows,
    ),
  }))

  clubs = clubs.map((c: any) => ({
    ...c,
    canton: c.city ? cityCantonMap.get(c.city) || null : null,
  }))

  // ── Process banners: one active per (owner_id, placement) — wide / card / left ──
  const seenOwnerPlacement = new Set<string>()
  const banners = (bannersRaw ?? [])
    .filter((b: any) => {
      const key = `${b.owner_id}:${normalizePlacement(b.placement)}`
      if (seenOwnerPlacement.has(key)) return false
      seenOwnerPlacement.add(key)
      return true
    })
    .map((b: any) => ({
      id: b.id,
      owner_type: b.owner_type,
      owner_id: b.owner_id,
      title: b.title,
      image_url: b.image_path ? `${SUPA_URL}/storage/v1/object/public/banners/${b.image_path}` : null,
      cta_url: b.cta_url,
      placement: normalizePlacement(b.placement),
    }))

  // ── Process listings ──
  const lPhotoMap = new Map<string, string>()
  for (const p of listingPhotos) {
    if (!lPhotoMap.has(p.listing_id) && p.file_path)
      lPhotoMap.set(p.listing_id, `${SUPA_URL}/storage/v1/object/public/job-listing-photos/${p.file_path}`)
  }
  const lProfileMap = new Map((listingProfiles).map((p: any) => [p.id, p.username]))
  const listings = (listingsRaw ?? []).map((l: any) => ({
    id: l.id, listing_type: l.listing_type, title: l.title, location: l.location,
    description: l.description || '', country_code: l.country_code || null,
    phone_number: l.phone_number || null, has_whatsapp: l.has_whatsapp || false,
    has_viber: l.has_viber || false, has_telegram: l.has_telegram || false,
    email: l.email || null, website: l.website || null,
    created_at: l.created_at, club_id: l.club_id,
    photoUrl: lPhotoMap.get(l.id) || null, club_name: lProfileMap.get(l.club_id) || '',
  }))

  // ── Process status messages ──
  const spMap = new Map((statusProfiles).map((x: any) => [x.id, x]))
  const sdMap = new Map((statusDetails).map((x: any) => [x.model_id, x]))
  const sphMap = new Map<string, string>()
  for (const p of statusPhotos) {
    if (!sphMap.has(p.model_id) && p.file_path)
      sphMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
  }
  const statusMessages = (statusRaw ?? []).map((s: any) => ({
    id: s.id, model_id: s.model_id, caption: s.message, created_at: s.created_at,
    model_name: sdMap.get(s.model_id)?.showname || spMap.get(s.model_id)?.username || 'Model',
    model_photo: sphMap.get(s.model_id) || null,
  }))

  // ── Process chat models ──
  const cpMap = new Map((chatProfiles).map((x: any) => [x.id, x]))
  const cphMap = new Map<string, string>()
  for (const p of chatPhotos) {
    if (!cphMap.has(p.model_id) && p.file_path)
      cphMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
  }
  const chatModels = (chatRaw ?? []).map((m: any) => ({
    id: m.model_id,
    model_name: m.showname || cpMap.get(m.model_id)?.username || 'Model',
    city: m.city || null,
    model_photo: cphMap.get(m.model_id) || null,
  }))

  return (
    <MixedHomeClient
      models={models}
      clubs={clubs}
      banners={banners}
      listings={listings}
      statusMessages={statusMessages}
      chatModels={chatModels}
    />
  )
}
