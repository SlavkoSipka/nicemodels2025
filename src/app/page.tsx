import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import HomePageClient from '@/components/home/HomePageClient'

// ISR: re-generate page every 60 s
export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  // 1. Get ordered model IDs with active ads
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
        .select('model_id, showname, city, age, ethnicity, hair_color, about_me, services_for')
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

    const detailsMap = new Map<string, any>()
    for (const d of allDetails ?? []) detailsMap.set(d.model_id, d)

    const servicesMap = new Map<string, any[]>()
    for (const s of allServices ?? []) {
      if (!servicesMap.has(s.model_id)) servicesMap.set(s.model_id, [])
      if (s.services) servicesMap.get(s.model_id)!.push(s.services)
    }

    const photosMap = new Map<string, string>()
    for (const p of allPhotos ?? []) {
      if (!photosMap.has(p.model_id) && p.file_path) {
        photosMap.set(
          p.model_id,
          `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`
        )
      }
    }

    models = modelsData.map((model: any) => ({
      ...model,
      model_details: detailsMap.get(model.id) ?? null,
      model_services_list: servicesMap.get(model.id) ?? [],
      photoUrl: photosMap.get(model.id) ?? null,
    }))
  }

  // Fetch active banners (not expired)
  const now = new Date().toISOString()
  const { data: bannersRaw } = await supabase
    .from('banners')
    .select('*')
    .eq('status', 'active')
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('display_order')

  // One banner per owner — deduplicate by owner_id, keep the most recent (first after ordering)
  const seenOwners = new Set<string>()
  const banners = (bannersRaw ?? [])
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

  const admin = createAdminClient()
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
      admin.from('profiles').select('id, username').in('id', msgModelIds),
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

    statusMessages = statusRaw.map(s => ({
      id: s.id,
      model_id: s.model_id,
      caption: s.message,
      created_at: s.created_at,
      model_name: detMap.get(s.model_id)?.showname || profMap.get(s.model_id)?.username || 'Model',
      model_photo: photoMap.get(s.model_id) || null,
    }))
  }

  return <HomePageClient initialModels={models} initialBanners={banners} statusMessages={statusMessages} />
}
