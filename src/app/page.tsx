import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MixedHomeClient from '@/components/home/MixedHomeClient'
import { resolveLiveLocationCanton } from '@/lib/live-location-canton'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const now = new Date().toISOString()

  // ── 1. Models with active ads ──
  const { data: modelsRaw } = await supabase.rpc('models_with_active_ads')
  const modelsData: any[] = modelsRaw ?? []
  const modelIds: string[] = modelsData.map((m: any) => m.id)

  let models: any[] = []
  if (modelIds.length > 0) {
    const [{ data: allDetails }, { data: allServices }, { data: allPhotos }, { data: allContacts }] = await Promise.all([
      supabase.from('model_details')
        .select('model_id, showname, city, age, ethnicity, hair_color, about_me, services_for, share_live_location, live_location_city, live_location_postal_code, live_location_updated_at')
        .in('model_id', modelIds),
      supabase.from('model_services')
        .select('model_id, services(id, name)')
        .in('model_id', modelIds),
      supabase.from('model_photos')
        .select('model_id, file_path')
        .in('model_id', modelIds)
        .eq('is_approved', true)
        .order('uploaded_at', { ascending: false }),
      supabase.from('model_contact_details')
        .select('model_id, show_phone_on_card, country_code, phone_number')
        .in('model_id', modelIds)
        .eq('show_phone_on_card', true),
    ])

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
    const contactPhoneMap = new Map<string, string>()
    for (const c of allContacts ?? []) {
      if (c.show_phone_on_card && c.phone_number) {
        contactPhoneMap.set(c.model_id, `${c.country_code || ''}${c.phone_number}`)
      }
    }

    models = modelsData.map((m: any) => ({
      ...m,
      model_details: detailsMap.get(m.id) ?? null,
      model_services_list: servicesMap.get(m.id) ?? [],
      photoUrl: photosMap.get(m.id) ?? null,
      cardPhone: contactPhoneMap.get(m.id) ?? null,
    }))

    const modelCityNames = [...new Set(
      models.map((m: any) => m.model_details?.city).filter(Boolean),
    )] as string[]

    const cityCantonMap = new Map<string, string>()
    if (modelCityNames.length > 0) {
      const { data: cityCantonsData } = await supabase
        .from('cities')
        .select('name, canton')
        .in('name', modelCityNames)
        .eq('is_active', true)

      for (const c of cityCantonsData || []) {
        if (c.name && c.canton && !cityCantonMap.has(c.name)) {
          cityCantonMap.set(c.name, c.canton)
        }
      }
    }

    const liveCityNames = [...new Set(
      models.map((m: any) => m.model_details?.live_location_city).filter(Boolean),
    )] as string[]

    let liveCityRows: { name: string; postal_code: string | null; canton: string | null }[] = []
    if (liveCityNames.length > 0) {
      const { data: liveRows } = await supabase
        .from('cities')
        .select('name, postal_code, canton')
        .in('name', liveCityNames)
        .eq('is_active', true)
      liveCityRows = liveRows || []
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
  }

  // ── 2. Clubs with active ads ──
  const { data: clubsRaw } = await supabase.rpc('clubs_with_active_ads')
  let clubs: any[] = []
  if (clubsRaw?.length) {
    const clubIds = clubsRaw.map((c: any) => c.id)
    const [{ data: clubDetails }, { data: clubContacts }, { data: clubPhotos }] = await Promise.all([
      supabase.from('club_details').select('club_id, display_name, club_name, is_club, area, about_description').in('club_id', clubIds),
      supabase.from('club_contact_details').select('club_id, city').in('club_id', clubIds),
      supabase.from('club_photos').select('club_id, file_path').in('club_id', clubIds).eq('is_approved', true).order('uploaded_at', { ascending: true }),
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

    // Look up canton for each club's city
    const clubCityNames = [...new Set(
      clubs.map((c: any) => c.city).filter(Boolean)
    )] as string[]

    if (clubCityNames.length > 0) {
      const { data: clubCityCantonsData } = await supabase
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
  }

  // ── 3. Banners ──
  const { data: bannersRaw } = await supabase.from('banners').select('*')
    .eq('status', 'active')
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('display_order')

  // Hide banners whose owner is blocked
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
  const banners = (bannersRaw ?? [])
    .filter((b: any) => !blockedOwnerIds.has(b.owner_id))
    .filter((b: any) => { if (seenOwners.has(b.owner_id)) return false; seenOwners.add(b.owner_id); return true })
    .map((b: any) => ({
      id: b.id, owner_type: b.owner_type, owner_id: b.owner_id, title: b.title,
      image_url: b.image_path ? `${SUPA_URL}/storage/v1/object/public/banners/${b.image_path}` : null,
      cta_url: b.cta_url,
    }))

  // ── 4. Job/Rent listings (active, not blocked) ──
  const { data: listingsRaw } = await supabase.from('job_listings')
    .select('id, listing_type, title, location, club_id, created_at, description, country_code, phone_number, has_whatsapp, has_viber, has_telegram, email, website')
    .eq('status', 'active')
    .eq('is_blocked', false)
    .order('created_at', { ascending: false })

  let listings: any[] = []
  if (listingsRaw?.length) {
    const listingIds = listingsRaw.map(l => l.id)
    const listingClubIds = [...new Set(listingsRaw.map(l => l.club_id).filter(Boolean))]

    const [{ data: listingPhotos }, { data: listingProfiles }] = await Promise.all([
      supabase.from('job_listing_photos').select('listing_id, file_path').in('listing_id', listingIds).order('display_order'),
      listingClubIds.length > 0
        ? supabase.from('profiles').select('id, username').in('id', listingClubIds)
        : Promise.resolve({ data: [] }),
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

  // ── 5. Status messages ──
  const { data: statusRaw } = await admin.from('model_status_messages')
    .select('id, model_id, message, created_at')
    .eq('is_active', true).gt('expires_at', now)
    .order('created_at', { ascending: false }).limit(50)

  let statusMessages: any[] = []
  if (statusRaw?.length) {
    const msgIds = [...new Set(statusRaw.map(s => s.model_id))]
    const [{ data: p1 }, { data: d1 }, { data: ph1 }] = await Promise.all([
      admin.from('profiles').select('id, username').in('id', msgIds).eq('is_blocked', false),
      admin.from('model_details').select('model_id, showname').in('model_id', msgIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', msgIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    ])
    const pMap = new Map((p1 || []).map(x => [x.id, x]))
    const dMap = new Map((d1 || []).map(x => [x.model_id, x]))
    const phMap = new Map<string, string>()
    for (const p of ph1 || []) { if (!phMap.has(p.model_id) && p.file_path) phMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`) }
    statusMessages = statusRaw.filter(s => pMap.has(s.model_id)).map(s => ({
      id: s.id, model_id: s.model_id, caption: s.message, created_at: s.created_at,
      model_name: dMap.get(s.model_id)?.showname || pMap.get(s.model_id)?.username || 'Model',
      model_photo: phMap.get(s.model_id) || null,
    }))
  }

  // ── 6. Chat models ──
  const { data: chatRaw } = await admin.from('model_details')
    .select('model_id, showname, city').eq('chat_available', true).limit(10)

  let chatModels: any[] = []
  if (chatRaw?.length) {
    const cIds = chatRaw.map(m => m.model_id)
    const [{ data: cp }, { data: cph }] = await Promise.all([
      admin.from('profiles').select('id, username').in('id', cIds).eq('is_blocked', false),
      admin.from('model_photos').select('model_id, file_path').in('model_id', cIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    ])
    const cpMap = new Map((cp || []).map(x => [x.id, x]))
    const cphMap = new Map<string, string>()
    for (const p of cph || []) { if (!cphMap.has(p.model_id) && p.file_path) cphMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`) }
    chatModels = chatRaw.filter(m => cpMap.has(m.model_id)).map(m => ({
      id: m.model_id, model_name: m.showname || cpMap.get(m.model_id)?.username || 'Model',
      city: m.city || null, model_photo: cphMap.get(m.model_id) || null,
    }))
  }

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
