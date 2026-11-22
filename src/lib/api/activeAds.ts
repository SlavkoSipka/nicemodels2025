import type { SupabaseClient } from '@supabase/supabase-js'

type ActiveAdsRpc = 'models_with_active_ads' | 'clubs_with_active_ads'

/**
 * Read one of the "active ads" RPCs, throwing on error.
 *
 * Public listings cache their data with `unstable_cache`. Returning an empty
 * list on a transient error would cache an empty page for the whole TTL;
 * throwing keeps the failure out of the cache so the last good render is
 * served instead. A genuinely empty result is still returned as [].
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
