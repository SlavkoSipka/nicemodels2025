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

// Mirrors the real model_details columns actually used by this file
// (getProfileById/getSimilarProfiles/getCitiesWithCounts). Contact info
// (phone/address) lives in a separate model_contact_details table, pricing
// in model_rates — neither has a scalar column here, so they're
// intentionally not declared. Older fields this interface previously
// claimed (location_city, price_per_hour, bio, height, weight, services,
// speaks_languages, working_hours*, custom_schedule) don't exist on the
// table at all; every one of this file's queries against them was
// silently returning null/empty or erroring.
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
 * Fetch featured/top models for homepage
 */
export async function getFeaturedProfiles(limit: number = 4, client: SupabaseClient) {
  const supabase = client

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      model_details(*)
    `)
    .eq('role', 'model')
    .eq('is_verified', true)
    .eq('is_blocked', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured profiles:', error)
    return []
  }

  // Load photos for each profile
  const profilesWithPhotos = await Promise.all((data || []).map(async (profile) => {
    const { data: photosData } = await supabase
      .from('model_photos')
      .select('*')
      .eq('model_id', profile.id)
      .eq('is_approved', true)
      .order('display_order', { ascending: true })
      .order('uploaded_at', { ascending: false })
      .limit(5)

    const photos = (photosData || []).map((photo) => {
      const { data: urlData } = supabase.storage
        .from('model-photos')
        .getPublicUrl(photo.file_path)
      
      return {
        id: photo.id,
        model_id: photo.model_id,
        photo_url: urlData.publicUrl || '',
        is_verified: false,
        is_primary: false,
        display_order: 0,
        created_at: photo.uploaded_at
      }
    })

    return {
      ...profile,
      photos
    }
  }))

  return profilesWithPhotos as Profile[]
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
 * Get single profile by ID with all details
 */
export async function getProfileById(id: string, client: SupabaseClient) {
  const supabase = client

  try {
    // First, try to get basic profile (blocked users are hidden from public lookups)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('is_blocked', false)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return null
    }

    if (!profile) {
      console.error('Profile not found:', id)
      return null
    }

    // Get model_details (keyed by model_id, not its own id column — that was
    // matching against the wrong id space and always returning nothing)
    const { data: modelDetails } = await supabase
      .from('model_details')
      .select('*')
      .eq('model_id', id)
      .maybeSingle()

    // Get contact details
    const { data: contactDetails } = await supabase
      .from('model_contact_details')
      .select('*')
      .eq('model_id', id)
      .maybeSingle()

    // Get photos from model_photos table
    const { data: photosData } = await supabase
      .from('model_photos')
      .select('*')
      .eq('model_id', id)
      .eq('is_approved', true)  // Only show approved photos
      .order('display_order', { ascending: true })
      .order('uploaded_at', { ascending: false })
    
    // Generate public URLs for photos
    const photos = (photosData || []).map((photo) => {
      const { data: urlData } = supabase.storage
        .from('model-photos')
        .getPublicUrl(photo.file_path)
      
      return {
        id: photo.id,
        model_id: photo.model_id,
        photo_url: urlData.publicUrl || '',
        is_verified: false,
        is_primary: false,
        display_order: 0,
        created_at: photo.uploaded_at
      }
    })

    // There is no `reviews` table — ratings/comments live in model_comments
    // (same source getModelRating reads). This legacy route never surfaced
    // real review text, only a rating average elsewhere on the page.
    const reviews: Review[] = []

    // languages/availability previously read model_details.speaks_languages /
    // .working_hours*, none of which exist on that table — they live in
    // separate model_languages / model_working_hours tables (see
    // src/app/models/[id]/page.tsx for the query shape). Left empty here
    // rather than silently reading a nonexistent column, since this route
    // is a deprecated, noindex, internally-unlinked duplicate of
    // /models/[id] (see generateMetadata above) — not worth wiring a second
    // copy of that query for a page nothing links to.
    const languages: { language_code: string; language_name: string }[] = []
    const availability: { day_of_week: number; start_time: string; end_time: string; is_available: boolean }[] = []

    return {
      ...profile,
      model_details: modelDetails,
      contact_details: contactDetails || null,
      photos: photos || [],
      reviews: reviews || [],
      languages: languages || [],
      availability: availability || [],
    } as Profile & {
      languages?: { language_code: string; language_name: string }[]
      availability?: {
        day_of_week: number
        start_time: string
        end_time: string
        is_available: boolean
      }[]
    }
  } catch (error) {
    console.error('Unexpected error in getProfileById:', error)
    return null
  }
}

/**
 * Get similar profiles (same city)
 */
export async function getSimilarProfiles(profileId: string, city: string, limit: number = 4, client: SupabaseClient) {
  const supabase = client

  // Same two constraints as searchProfiles: model_details needs an explicit
  // FK hint (profiles has two relationships to it), and embedded-resource
  // dot-path filters don't reliably apply once disambiguated — so city is
  // resolved via a direct model_details query first.
  const { data: matchingDetails } = await supabase
    .from('model_details')
    .select('model_id')
    .eq('city', city)
  const matchingModelIds = (matchingDetails ?? []).map((d) => d.model_id)

  if (matchingModelIds.length === 0) return []

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      model_details!model_details_model_id_fkey(*)
    `)
    .eq('role', 'model')
    .eq('is_blocked', false)
    .in('id', matchingModelIds)
    .neq('id', profileId)
    .limit(limit)

  if (error) {
    console.error('Error fetching similar profiles:', error)
    return []
  }

  // Load photos for each profile
  const profilesWithPhotos = await Promise.all((data || []).map(async (profile) => {
    const { data: photosData } = await supabase
      .from('model_photos')
      .select('*')
      .eq('model_id', profile.id)
      .eq('is_approved', true)
      .order('display_order', { ascending: true })
      .order('uploaded_at', { ascending: false })
      .limit(5)

    const photos = (photosData || []).map((photo) => {
      const { data: urlData } = supabase.storage
        .from('model-photos')
        .getPublicUrl(photo.file_path)
      
      return {
        id: photo.id,
        model_id: photo.model_id,
        photo_url: urlData.publicUrl || '',
        is_verified: false,
        is_primary: false,
        display_order: 0,
        created_at: photo.uploaded_at
      }
    })

    return {
      ...profile,
      photos
    }
  }))

  return profilesWithPhotos as Profile[]
}

/**
 * Calculate average rating for a model
 */
export async function getModelRating(modelId: string, client: SupabaseClient) {
  const supabase = client

  // Ratings live on model_comments.rating (visible = approved/reviewed).
  const { data, error } = await supabase
    .from('model_comments')
    .select('rating')
    .eq('model_id', modelId)
    .in('status', ['approved', 'reviewed'])
    .not('rating', 'is', null)

  if (error || !data || data.length === 0) {
    return { rating: 0, count: 0 }
  }

  const sum = data.reduce((acc, row) => acc + (row.rating || 0), 0)
  const average = sum / data.length

  return {
    rating: Math.round(average * 10) / 10, // Round to 1 decimal
    count: data.length,
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
 * Get all profiles (models) - for homepage display
 */
export async function getAllProfiles(page: number = 1, pageSize: number = 24, client: SupabaseClient) {
  return searchProfiles({}, page, pageSize, client)
}

/**
 * Get cities/areas with profile counts
 */
export async function getCitiesWithCounts(client: SupabaseClient) {
  const supabase = client

  // model_details.city is the real column (there's no location_city, and
  // no need for the profiles/model_details embed at all — the ambiguous
  // two-FK relationship between them makes that embed error outright, see
  // searchProfiles for the same issue).
  const { data, error } = await supabase
    .from('model_details')
    .select('city')
    .not('city', 'is', null)

  if (error) {
    console.error('Error fetching cities:', error)
    return []
  }

  // Count profiles per city
  const cityCounts: Record<string, number> = {}
  for (const row of data ?? []) {
    if (row.city) cityCounts[row.city] = (cityCounts[row.city] || 0) + 1
  }

  // Convert to array and sort
  const cities = Object.entries(cityCounts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)

  return cities
}

/**
 * Get total profile count
 */
export async function getTotalProfileCount(client: SupabaseClient) {
  const supabase = client

  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'model')

  if (error) {
    console.error('Error fetching total count:', error)
    return 0
  }

  return count || 0
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

