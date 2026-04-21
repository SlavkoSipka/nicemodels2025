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

  let query = supabase
    .from('profiles')
    .select(`
      *,
      model_details(*)
    `, { count: 'exact' })
    .eq('role', 'model')
    .eq('is_blocked', false)

  // Apply filters
  if (filters.verified) {
    query = query.eq('is_verified', true)
  }

  // Filter by model_details
  if (filters.city) {
    query = query.eq('model_details.location_city', filters.city)
  }

  if (filters.country) {
    query = query.eq('model_details.location_country', filters.country)
  }

  if (filters.minAge) {
    query = query.gte('model_details.age', filters.minAge)
  }

  if (filters.maxAge) {
    query = query.lte('model_details.age', filters.maxAge)
  }

  if (filters.minPrice) {
    query = query.gte('model_details.price_per_hour', filters.minPrice)
  }

  if (filters.maxPrice) {
    query = query.lte('model_details.price_per_hour', filters.maxPrice)
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

  // Load photos for each profile
  const profilesWithPhotos = await Promise.all((data || []).map(async (profile) => {
    const { data: photosData } = await supabase
      .from('model_photos')
      .select('*')
      .eq('model_id', profile.id)
      .eq('is_approved', true)
      .order('uploaded_at', { ascending: false })
      .limit(5) // Limit to 5 photos for performance

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

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('model_id', modelId)
    .eq('is_approved', true)

  if (error || !data || data.length === 0) {
    return { rating: 0, count: 0 }
  }

  const sum = data.reduce((acc, review) => acc + review.rating, 0)
  const average = sum / data.length

  return {
    rating: Math.round(average * 10) / 10, // Round to 1 decimal
    count: data.length,
  }
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

