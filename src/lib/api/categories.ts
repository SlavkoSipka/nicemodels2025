import { createClient } from '@/lib/supabase/client'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon_url: string | null
  created_at: string
}

/**
 * Fetch all categories
 */
export async function getCategories() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data as Category[]
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }

  return data as Category
}

/**
 * Count profiles in each category
 */
export async function getCategoryCounts() {
  const supabase = createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, name')

  if (!categories) return {}

  const counts: Record<string, number> = {}

  for (const category of categories) {
    const { count } = await supabase
      .from('model_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id)

    counts[category.slug] = count || 0
  }

  return counts
}

