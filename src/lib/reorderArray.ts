import type { SupabaseClient } from '@supabase/supabase-js'

export function reorderArray<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return list
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) return list
  const next = [...list]
  const [removed] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, removed)
  return next
}

export async function persistPhotoDisplayOrder(
  supabase: SupabaseClient,
  table: 'model_photos' | 'club_photos',
  orderedIds: string[],
): Promise<boolean> {
  const results = await Promise.all(
    orderedIds.map((id, display_order) =>
      supabase.from(table).update({ display_order }).eq('id', id),
    ),
  )
  return results.every((r) => !r.error)
}
