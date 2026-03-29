import type { SupabaseClient } from '@supabase/supabase-js'

/** Display name for discussion post authors (public read). */
export async function resolveAuthorLabels(
  supabase: SupabaseClient,
  authorIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const ids = [...new Set(authorIds)].filter(Boolean)
  if (ids.length === 0) return map

  const [{ data: profiles }, { data: models }, { data: clubs }] = await Promise.all([
    supabase.from('profiles').select('id, username, role').in('id', ids),
    supabase.from('model_details').select('model_id, showname').in('model_id', ids),
    supabase.from('club_details').select('club_id, display_name, club_name').in('club_id', ids),
  ])

  const modelMap = new Map((models || []).map(m => [m.model_id, m.showname]))
  const clubMap = new Map(
    (clubs || []).map(c => [c.club_id, c.display_name || c.club_name]),
  )

  for (const p of profiles || []) {
    if (p.role === 'model' && modelMap.get(p.id)) {
      map.set(p.id, modelMap.get(p.id) || p.username || 'Member')
    } else if (p.role === 'company' && clubMap.get(p.id)) {
      map.set(p.id, clubMap.get(p.id) || p.username || 'Club')
    } else if (p.role === 'admin') {
      map.set(p.id, 'Admin')
    } else {
      map.set(p.id, p.username || 'Member')
    }
  }

  for (const id of ids) {
    if (!map.has(id)) map.set(id, 'Member')
  }

  return map
}
