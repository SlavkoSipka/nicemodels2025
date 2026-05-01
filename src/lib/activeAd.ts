import type { SupabaseClient } from '@supabase/supabase-js'

export interface ActiveAdStatus {
  hasActiveAd: boolean
  activeAdExpiry: Date | null
  lastExpiredAd: Date | null
}

/**
 * Returns whether the given user currently has an active ad_package purchase.
 * "Active" = the order is paid, the package's start (activation_date OR order
 * created_at) is in the past, and start + duration is still in the future.
 */
export async function checkActiveAd(
  supabase: SupabaseClient,
  userId: string
): Promise<ActiveAdStatus> {
  const result: ActiveAdStatus = {
    hasActiveAd: false,
    activeAdExpiry: null,
    lastExpiredAd: null,
  }

  try {
    const { data } = await supabase
      .from('order_items')
      .select(`
        id,
        activation_date,
        orders!inner(user_id, status, created_at),
        products!inner(product_type, duration_days, duration_hours)
      `)
      .eq('orders.user_id', userId)
      .eq('orders.status', 'paid')
      .eq('products.product_type', 'ad_package')

    if (!data || data.length === 0) return result

    const now = new Date()
    let latestExpiry: Date | null = null

    for (const item of data) {
      const order = (item as any).orders
      const product = (item as any).products
      const startDate = item.activation_date
        ? new Date(item.activation_date)
        : new Date(order.created_at)
      const durationMs =
        product.duration_days * 86400000 + product.duration_hours * 3600000
      const expiryDate = new Date(startDate.getTime() + durationMs)

      if (startDate <= now && expiryDate > now) {
        result.hasActiveAd = true
        result.activeAdExpiry = expiryDate
        return result
      }

      if (expiryDate <= now && (!latestExpiry || expiryDate > latestExpiry)) {
        latestExpiry = expiryDate
      }
    }

    result.lastExpiredAd = latestExpiry
    return result
  } catch {
    return result
  }
}
