import type { SupabaseClient } from '@supabase/supabase-js'

type EntityKind = 'model' | 'club' | 'listing'

const RPC_BY_KIND: Record<EntityKind, { fn: string; idsArg: string; idCol: string }> = {
  model:   { fn: 'get_model_view_counts',   idsArg: 'model_ids',   idCol: 'model_id' },
  club:    { fn: 'get_club_view_counts',    idsArg: 'club_ids',    idCol: 'club_id' },
  listing: { fn: 'get_listing_view_counts', idsArg: 'listing_ids', idCol: 'listing_id' },
}

/**
 * Fetch aggregated view counts for a set of IDs. Returns a Map (id -> count).
 * Missing IDs are treated as 0 views. Silent on errors.
 */
export async function fetchViewCounts(
  supabase: SupabaseClient,
  kind: EntityKind,
  ids: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (!ids || ids.length === 0) return out
  const cfg = RPC_BY_KIND[kind]
  try {
    const { data, error } = await supabase.rpc(cfg.fn, { [cfg.idsArg]: ids })
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[viewCounts] ${cfg.fn} failed`, error.message)
      }
      return out
    }
    if (!data) return out
    for (const row of data as Array<Record<string, unknown>>) {
      const id = row[cfg.idCol] as string | undefined
      const count = Number(row.view_count ?? 0)
      if (id) out.set(id, count)
    }
  } catch {
    // silent fail — view counts are non-critical UX
  }
  return out
}
