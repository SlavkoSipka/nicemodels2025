import type { SupabaseClient } from '@supabase/supabase-js'

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'model' | 'admin'
  is_verified: boolean
  created_at: string
  model_details?: ModelDetails | null
  photos?: Photo[]
  reviews?: Review[]
}

// The model_details columns read by search. Contact data and rates live in
// model_contact_details and model_rates.
export interface ModelDetails {
  id: string
  model_id: string
  showname: string | null
  city: string | null
  age: number | null
  about_me: string | null
  services_for: string[] | null
  height_cm: number | null
}

export interface Photo {
  id: string
  model_id: string
  photo_url: string
  is_verified: boolean
  is_primary: boolean
  display_order: number
  created_at: string
}

export interface Review {
  id: string
  model_id: string
  reviewer_id: string
  rating: number
  comment: string | null
  is_verified: boolean
  is_approved: boolean
  created_at: string
  reviewer?: {
    full_name: string | null
    username: string | null
  }
}

export interface SearchFilters {
  category?: string
  city?: string
  country?: string
  minAge?: number
  maxAge?: number
  minPrice?: number
  maxPrice?: number
  services?: string[]
  verified?: boolean
}

/**
 * Search profiles with filters
 */
export async function searchProfiles(filters: SearchFilters, page: number = 1, pageSize: number = 12, client: SupabaseClient) {
  const supabase = client
  const offset = (page - 1) * pageSize

  // model_details has two FK relationships to profiles (model_id and club_id),
  // so the embed below must be disambiguated with an explicit FK hint —
  // otherwise Postgrest rejects every query with an ambiguous-embed error.
  // Embedded-resource dot-path filters (e.g. .eq('model_details.city', ...))
  // don't reliably apply once disambiguated, so city/age filters are resolved
  // via a direct model_details query first instead, mirroring the pattern
  // already used in src/app/page.tsx and src/app/escort/[city]/page.tsx.
  //
  // country/minPrice/maxPrice are intentionally not applied: model_details
  // has no location_country or price_per_hour column — pricing lives in a
  // separate model_rates table keyed by rate_type/duration, with no single
  // "price" figure to filter on without a product decision on which rate
  // represents "the" price.
  let matchingModelIds: string[] | null = null
  if (filters.city || filters.minAge || filters.maxAge) {
    let detailsQuery = supabase.from('model_details').select('model_id')
    if (filters.city) detailsQuery = detailsQuery.eq('city', filters.city)
    if (filters.minAge) detailsQuery = detailsQuery.gte('age', filters.minAge)
    if (filters.maxAge) detailsQuery = detailsQuery.lte('age', filters.maxAge)
    const { data: matchingDetails } = await detailsQuery
    matchingModelIds = (matchingDetails ?? []).map((d) => d.model_id)
  }

  let query = supabase
    .from('profiles')
    .select(`
      *,
      model_details!model_details_model_id_fkey(*)
    `, { count: 'exact' })
    .eq('role', 'model')
    .eq('is_blocked', false)

  if (filters.verified) {
    query = query.eq('is_verified', true)
  }

  if (matchingModelIds !== null) {
    query = query.in('id', matchingModelIds)
  }

  // Pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error searching profiles:', error)
    return { profiles: [], total: 0 }
  }

  const profileIds = (data || []).map((p) => p.id)

  // Load photos for ALL profiles in ONE query (was an N+1: one query per profile).
  const photosByModel = new Map<string, Photo[]>()
  if (profileIds.length > 0) {
    const { data: photosData } = await supabase
      .from('model_photos')
      .select('id, model_id, file_path, uploaded_at')
      .in('model_id', profileIds)
      .eq('is_approved', true)
      .order('model_id')
      .order('display_order', { ascending: true })
      .order('uploaded_at', { ascending: false })

    for (const photo of photosData || []) {
      const list = photosByModel.get(photo.model_id) || []
      // Keep parity with the previous per-profile limit of 5.
      if (list.length >= 5) continue
      const { data: urlData } = supabase.storage
        .from('model-photos')
        .getPublicUrl(photo.file_path)
      list.push({
        id: photo.id,
        model_id: photo.model_id,
        photo_url: urlData.publicUrl || '',
        is_verified: false,
        is_primary: false,
        display_order: 0,
        created_at: photo.uploaded_at,
      })
      photosByModel.set(photo.model_id, list)
    }
  }

  const profilesWithPhotos = (data || []).map((profile) => ({
    ...profile,
    photos: photosByModel.get(profile.id) || [],
  }))

  return {
    profiles: profilesWithPhotos as Profile[],
    total: count || 0,
  }
}

/**
 * Average rating + review count for many models in ONE query (avoids the
 * N+1 of calling getModelRating per profile).
 */
export async function getModelRatingsBatch(
  modelIds: string[],
  client: SupabaseClient,
): Promise<Map<string, { rating: number; count: number }>> {
  const result = new Map<string, { rating: number; count: number }>()
  if (!modelIds.length) return result

  const { data, error } = await client
    .from('model_comments')
    .select('model_id, rating')
    .in('model_id', modelIds)
    .in('status', ['approved', 'reviewed'])
    .not('rating', 'is', null)

  if (error || !data) return result

  const acc = new Map<string, { sum: number; count: number }>()
  for (const row of data as { model_id: string; rating: number | null }[]) {
    if (row.rating == null) continue
    const cur = acc.get(row.model_id) || { sum: 0, count: 0 }
    cur.sum += row.rating
    cur.count += 1
    acc.set(row.model_id, cur)
  }
  for (const [id, { sum, count }] of acc) {
    result.set(id, { rating: count ? Math.round((sum / count) * 10) / 10 : 0, count })
  }
  return result
}

/**
 * Get primary photo for a model
 */
export function getPrimaryPhoto(photos: Photo[] | undefined): string {
  if (!photos || photos.length === 0) {
    // Default placeholder image - using a neutral placeholder
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop'
  }

  const primary = photos.find(p => p.is_primary)
  return primary?.photo_url || photos[0].photo_url
}

