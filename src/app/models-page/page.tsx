import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import HomePageClient from '@/components/home/HomePageClient'
import { resolveLiveLocationCanton } from '@/lib/live-location-canton'
import { fetchViewCounts } from '@/lib/viewCounts'

export const revalidate = 60

export default async function ModelsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const { data: modelsRaw } = await supabase.rpc('models_with_active_ads')
  const modelsData: any[] = modelsRaw ?? []
  const modelIds: string[] = modelsData.map((m: any) => m.id)

  let models: any[] = []

  if (modelIds.length > 0) {
    const [
      { data: allDetails },
      { data: allServices },
      { data: allPhotos },
    ] = await Promise.all([
      supabase
        .from('model_details')
        .select('model_id, showname, city, age, ethnicity, hair_color, about_me, services_for, share_live_location, live_location_city, live_location_postal_code, live_location_updated_at')
        .in('model_id', modelIds),
      supabase
        .from('model_services')
        .select('model_id, services(id, name)')
        .in('model_id', modelIds),
      supabase
        .from('model_photos')
        .select('model_id, file_path')
        .in('model_id', modelIds)
        .eq('is_approved', true)
        .order('uploaded_at', { ascending: false }),
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
      if (!photosMap.has(p.model_id) && p.file_path) {
        photosMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }

    models = modelsData.map((model: any) => ({
      ...model,
      model_details: detailsMap.get(model.id) ?? null,
      model_services_list: servicesMap.get(model.id) ?? [],
      photoUrl: photosMap.get(model.id) ?? null,
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

    const viewCountMap = await fetchViewCounts(admin, 'model', modelIds)

    models = models.map((m: any) => ({
      ...m,
      canton: m.model_details?.city ? cityCantonMap.get(m.model_details.city) || null : null,
      live_location_canton: resolveLiveLocationCanton(
        m.model_details?.live_location_city,
        m.model_details?.live_location_postal_code,
        liveCityRows,
      ),
      view_count: viewCountMap.get(m.id) ?? 0,
    }))
  }

  const now = new Date().toISOString()
  const { data: bannersRaw } = await supabase
    .from('banners')
    .select('*')
    .eq('status', 'active')
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('display_order')

  // Hide banners whose owner is blocked
  const adminForBanners = createAdminClient()
  const bannerOwnerIds = [...new Set((bannersRaw ?? []).map((b: any) => b.owner_id).filter(Boolean))]
  let blockedBannerOwners = new Set<string>()
  if (bannerOwnerIds.length > 0) {
    const { data: ownerProfiles } = await adminForBanners
      .from('profiles')
      .select('id, is_blocked')
      .in('id', bannerOwnerIds)
    blockedBannerOwners = new Set((ownerProfiles ?? []).filter(p => p.is_blocked).map(p => p.id))
  }

  const seenOwners = new Set<string>()
  const banners = (bannersRaw ?? [])
    .filter((b: any) => !blockedBannerOwners.has(b.owner_id))
    .filter((b: any) => {
      if (seenOwners.has(b.owner_id)) return false
      seenOwners.add(b.owner_id)
      return true
    })
    .map((b: any) => ({
      id: b.id,
      owner_type: b.owner_type,
      owner_id: b.owner_id,
      title: b.title,
      image_url: b.image_path ? `${SUPA_URL}/storage/v1/object/public/banners/${b.image_path}` : null,
      cta_url: b.cta_url,
    }))

  const { data: statusRaw } = await admin
    .from('model_status_messages')
    .select('id, model_id, message, created_at')
    .eq('is_active', true)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(50)

  let statusMessages: any[] = []
  if (statusRaw?.length) {
    const msgModelIds = [...new Set(statusRaw.map(s => s.model_id))]
    const [{ data: msgProfiles }, { data: msgDetails }, { data: msgPhotos }] = await Promise.all([
      admin.from('profiles').select('id, username').in('id', msgModelIds).eq('is_blocked', false),
      admin.from('model_details').select('model_id, showname').in('model_id', msgModelIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', msgModelIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    ])

    const profMap = new Map((msgProfiles || []).map(p => [p.id, p]))
    const detMap = new Map((msgDetails || []).map(d => [d.model_id, d]))
    const photoMap = new Map<string, string>()
    for (const p of msgPhotos || []) {
      if (!photoMap.has(p.model_id) && p.file_path) {
        photoMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }

    statusMessages = statusRaw.filter(s => profMap.has(s.model_id)).map(s => ({
      id: s.id,
      model_id: s.model_id,
      caption: s.message,
      created_at: s.created_at,
      model_name: detMap.get(s.model_id)?.showname || profMap.get(s.model_id)?.username || 'Model',
      model_photo: photoMap.get(s.model_id) || null,
    }))
  }

  const { data: chatRaw } = await admin
    .from('model_details')
    .select('model_id, showname, city')
    .eq('chat_available', true)
    .limit(10)

  let chatModels: any[] = []
  if (chatRaw?.length) {
    const chatModelIds = chatRaw.map(m => m.model_id)
    const [{ data: chatProfiles }, { data: chatPhotos }] = await Promise.all([
      admin.from('profiles').select('id, username').in('id', chatModelIds).eq('is_blocked', false),
      admin.from('model_photos').select('model_id, file_path').in('model_id', chatModelIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    ])
    const cpMap = new Map((chatProfiles || []).map(p => [p.id, p]))
    const photoMapChat = new Map<string, string>()
    for (const p of chatPhotos || []) {
      if (!photoMapChat.has(p.model_id) && p.file_path) {
        photoMapChat.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }
    chatModels = chatRaw.filter(m => cpMap.has(m.model_id)).map(m => ({
      id: m.model_id,
      model_name: m.showname || cpMap.get(m.model_id)?.username || 'Model',
      city: m.city || null,
      model_photo: photoMapChat.get(m.model_id) || null,
    }))
  }

  return <HomePageClient initialModels={models} initialBanners={banners} statusMessages={statusMessages} chatModels={chatModels} />
}
