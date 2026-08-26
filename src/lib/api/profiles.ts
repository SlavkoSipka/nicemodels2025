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

export interface ModelDetails {
  id: string
  location_city: string | null
  location_country: string | null
  postal_code: string | null
  address: string | null
  phone_number: string | null
  bio: string | null
  height: number | null
  weight: number | null
  age: number | null
  services: string[] | null
  price_per_hour: number | null
  price_per_night: number | null
  speaks_languages: string[] | null // Languages as array
  working_hours: string | null
  working_hours_type: 'custom' | 'same' | '24/7' | null
  custom_schedule: any | null // JSONB for custom schedule
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

    // Get model_details
    const { data: modelDetails } = await supabase
      .from('model_details')
      .select('*')
      .eq('id', id)
      .single()

    // Get contact details
    const { data: contactDetails } = await supabase
      .from('model_contact_details')
      .select('*')
      .eq('model_id', id)
      .single()

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

    // Get reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, username)')
      .eq('model_id', id)
      .eq('is_approved', true)

    // Get languages from model_details.speaks_languages array
    // Languages are now stored as text[] array in model_details
    const languages = modelDetails?.speaks_languages?.map((lang: string) => ({
      language_code: lang,
      language_name: lang,
      proficiency_level: 'fluent' // Default, since we don't store proficiency in array
    })) || []

    // Get availability from model_details (working_hours, working_hours_type, custom_schedule)
    // Availability is now stored in model_details instead of separate table
    const availability = modelDetails?.working_hours_type === 'custom' && modelDetails?.custom_schedule
      ? modelDetails.custom_schedule
      : modelDetails?.working_hours
        ? [{ working_hours: modelDetails.working_hours, type: modelDetails.working_hours_type }]
        : []

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

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      model_details(*)
    `)
    .eq('role', 'model')
    .eq('is_blocked', false)
    .eq('model_details.location_city', city)
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

  // Get all model profiles with their cities
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      model_details!inner(location_city)
    `)
    .eq('role', 'model')
    .not('model_details.location_city', 'is', null)

  if (error) {
    console.error('Error fetching cities:', error)
    // Fallback: try without inner join
    const { data: fallbackData } = await supabase
      .from('model_details')
      .select('location_city')
      .not('location_city', 'is', null)
    
    if (!fallbackData) return []
    
    const cityCounts: Record<string, number> = {}
    fallbackData.forEach((detail: any) => {
      if (detail.location_city) {
        cityCounts[detail.location_city] = (cityCounts[detail.location_city] || 0) + 1
      }
    })
    
    return Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
  }

  // Count profiles per city
  const cityCounts: Record<string, number> = {}
  data?.forEach((item: any) => {
    const city = item.model_details?.location_city
    if (city) {
      cityCounts[city] = (cityCounts[city] || 0) + 1
    }
  })

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

