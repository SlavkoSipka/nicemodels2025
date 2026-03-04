import { createClient } from '@/lib/supabase/server'
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
    // 2-4. Three parallel batch queries — replaces N×3 per-model queries
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

    // Build lookup maps for O(1) access
    const detailsMap = new Map<string, any>()
    for (const d of allDetails ?? []) detailsMap.set(d.model_id, d)

    const servicesMap = new Map<string, any[]>()
    for (const s of allServices ?? []) {
      if (!servicesMap.has(s.model_id)) servicesMap.set(s.model_id, [])
      if (s.services) servicesMap.get(s.model_id)!.push(s.services)
    }

    // Only keep first approved photo per model
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

  return <HomePageClient initialModels={models} />
}
