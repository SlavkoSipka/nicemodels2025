import type { SupabaseClient } from '@supabase/supabase-js'

type ActiveAdsRpc = 'models_with_active_ads' | 'clubs_with_active_ads'

/**
 * Read one of the "active ads" RPCs, failing loudly instead of returning [].
 *
 * The public listings wrap their data loaders in `unstable_cache`. A discarded
 * RPC error used to become an empty list, and the cache then stored that empty
 * page for the whole TTL (60s on / and /models-page, 900s on /escort/*), so a
 * single transient Supabase failure showed "Noch keine Inhalte" to every
 * visitor for minutes while the database was healthy. Throwing keeps the bad
 * result out of the cache, and Next keeps serving the last good render.
 *
 * An empty array is still returned when the RPC genuinely matches no rows —
 * that is a real state, not a failure.
 */
export async function fetchActiveAds<T = Record<string, unknown>>(
  admin: SupabaseClient,
  rpc: ActiveAdsRpc,
): Promise<T[]> {
  const { data, error } = await admin.rpc(rpc)
  if (error) {
    throw new Error(`${rpc} failed: ${error.message}`)
  }
  return (data ?? []) as T[]
}
