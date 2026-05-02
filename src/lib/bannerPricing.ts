import type { SupabaseClient } from '@supabase/supabase-js'
import type { BannerPlacement } from './bannerPlacement'

export interface BannerRegionPriceRow {
  placement: BannerPlacement
  duration_days: number
  region_count: number
  price_chf: number
}

/**
 * Fetch all active banner pricing rows. Beta phase keeps everything at 0;
 * admin updates these values later. Caller can do client-side `.find()`
 * lookups for instant UI feedback as the buyer changes selection.
 */
export async function fetchBannerRegionPricing(
  supabase: SupabaseClient,
): Promise<BannerRegionPriceRow[]> {
  const { data } = await supabase
    .from('banner_region_pricing')
    .select('placement, duration_days, region_count, price_chf')
    .eq('is_active', true)
  return (data || []) as BannerRegionPriceRow[]
}

export function findBannerPrice(
  rows: BannerRegionPriceRow[],
  placement: BannerPlacement | null,
  durationDays: number | null,
  regionCount: number,
): number | null {
  if (!placement || !durationDays || regionCount < 1) return null
  const row = rows.find(
    r =>
      r.placement === placement &&
      r.duration_days === durationDays &&
      r.region_count === regionCount,
  )
  return row?.price_chf ?? null
}
