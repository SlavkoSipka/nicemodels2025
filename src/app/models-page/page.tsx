import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import HomePageClient from '@/components/home/HomePageClient'
import { resolveLiveLocationCanton } from '@/lib/live-location-canton'
import { normalizePlacement } from '@/lib/bannerPlacement'

export const metadata: Metadata = {
  title: 'Alle Escort-Models – Schweiz',
  description:
    'Durchsuche alle verifizierten Escort-Models in der Schweiz. Aktuelle Profile mit Fotos, Services und Bewertungen auf NiceModels.ch.',
  alternates: { canonical: 'https://www.nicemodels.ch/models-page' },
}

export const revalidate = 60

export default async function ModelsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const now = new Date().toISOString()

  // ── Stage 1: ALL independent queries in parallel ──
  const [
    { data: modelsRaw },
    { data: bannersRaw },
    { data: statusRaw },
    { data: chatRaw },
  ] = await Promise.all([
    supabase.rpc('models_with_active_ads'),
    supabase.from('banners').select('*')
      .eq('status', 'active')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('display_order'),
    admin.from('model_status_messages')
      .select('id, model_id, message, created_at')
      .eq('is_active', true).gt('expires_at', now)
      .order('created_at', { ascending: false }).limit(50),
    admin.from('model_details')
      .select('model_id, showname, city').eq('chat_available', true).limit(10),
  ])

  const modelsData: any[] = modelsRaw ?? []
  const modelIds = modelsData.map((m: any) => m.id)
  const statusModelIds = [...new Set((statusRaw ?? []).map((s: any) => s.model_id))]
  const chatModelIds = (chatRaw ?? []).map((m: any) => m.model_id)

  // ── Stage 2: ALL detail queries in parallel ──
  const stage2: Promise<any>[] = []

  // Models (0-2)
  if (modelIds.length > 0) {
    stage2.push(
      supabase.from('model_details')
        .select('model_id, showname, city, age, ethnicity, hair_color, about_me, services_for, share_live_location, live_location_city, live_location_postal_code, live_location_updated_at')
        .in('model_id', modelIds),
      supabase.from('model_services').select('model_id, services(id, name)').in('model_id', modelIds),
      supabase.from('model_photos').select('model_id, file_path').in('model_id', modelIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    )
  } else {
    stage2.push(Promise.resolve({ data: [] }), Promise.resolve({ data: [] }), Promise.resolve({ data: [] }))
  }

  // Status messages (3-5)
  if (statusModelIds.length > 0) {
    stage2.push(
      admin.from('profiles').select('id, username').in('id', statusModelIds),
      admin.from('model_details').select('model_id, showname').in('model_id', statusModelIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', statusModelIds)
        .eq('is_approved', true).order('uploaded_at', { ascending: false }),
    )
  } else {
    stage2.push(Promise.resolve({ data: [] }), Promise.resolve({ data: [] }), Promise.resolve({ data: [] }))
  }

  // Chat models (6-7)
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

  // ── Process models ──
  const TWO_HOURS = 2 * 60 * 60 * 1000
  const detailsMap = new Map<string, any>()
  for (const d of s2[0].data ?? []) {
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
  for (const s of s2[1].data ?? []) {
    if (!servicesMap.has(s.model_id)) servicesMap.set(s.model_id, [])
    if (s.services) servicesMap.get(s.model_id)!.push(s.services)
  }
  const photosMap = new Map<string, string>()
  for (const p of s2[2].data ?? []) {
    if (!photosMap.has(p.model_id) && p.file_path)
      photosMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
  }

  let models = modelsData.map((m: any) => ({
    ...m,
    model_details: detailsMap.get(m.id) ?? null,
    model_services_list: servicesMap.get(m.id) ?? [],
    photoUrl: photosMap.get(m.id) ?? null,
  }))

  // ── Stage 3: City/canton lookup (single query for all city names) ──
  const modelCityNames = [...new Set(models.map((m: any) => m.model_details?.city).filter(Boolean))] as string[]
  const liveCityNames = [...new Set(models.map((m: any) => m.model_details?.live_location_city).filter(Boolean))] as string[]
  const allCityNames = [...new Set([...modelCityNames, ...liveCityNames])]

  let cityCantonMap = new Map<string, string>()
  let liveCityRows: { name: string; postal_code: string | null; canton: string | null }[] = []

  if (allCityNames.length > 0) {
    const { data: citiesData } = await supabase
      .from('cities').select('name, postal_code, canton')
      .in('name', allCityNames).eq('is_active', true)

    for (const c of citiesData || []) {
      if (c.name && c.canton && !cityCantonMap.has(c.name)) cityCantonMap.set(c.name, c.canton)
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
      id: b.id, owner_type: b.owner_type, owner_id: b.owner_id, title: b.title,
      image_url: b.image_path ? `${SUPA_URL}/storage/v1/object/public/banners/${b.image_path}` : null,
      cta_url: b.cta_url,
      placement: normalizePlacement(b.placement),
    }))

  // ── Process status messages ──
  const spMap = new Map((s2[3].data ?? []).map((x: any) => [x.id, x]))
  const sdMap = new Map((s2[4].data ?? []).map((x: any) => [x.model_id, x]))
  const sphMap = new Map<string, string>()
  for (const p of s2[5].data ?? []) {
    if (!sphMap.has(p.model_id) && p.file_path)
      sphMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
  }
  const statusMessages = (statusRaw ?? []).map((s: any) => ({
    id: s.id, model_id: s.model_id, caption: s.message, created_at: s.created_at,
    model_name: sdMap.get(s.model_id)?.showname || spMap.get(s.model_id)?.username || 'Model',
    model_photo: sphMap.get(s.model_id) || null,
  }))

  // ── Process chat models ──
  const cpMap = new Map((s2[6].data ?? []).map((x: any) => [x.id, x]))
  const cphMap = new Map<string, string>()
  for (const p of s2[7].data ?? []) {
    if (!cphMap.has(p.model_id) && p.file_path)
      cphMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
  }
  const chatModels = (chatRaw ?? []).map((m: any) => ({
    id: m.model_id,
    model_name: m.showname || cpMap.get(m.model_id)?.username || 'Model',
    city: m.city || null,
    model_photo: cphMap.get(m.model_id) || null,
  }))

  return <HomePageClient initialModels={models} initialBanners={banners} statusMessages={statusMessages} chatModels={chatModels} />
}
