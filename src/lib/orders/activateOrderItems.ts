import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * After an order is paid, flip order_items side tables from pending_payment to
 * active and set starts_at / expires_at. Pure ad_package rows are a no-op here.
 */
export async function activateOrderItems(admin: AdminClient, orderId: string) {
  const { data: items } = await admin
    .from('order_items')
    .select(`
      id, banner_id, listing_id, activation_type, activation_date,
      product:products(duration_days, duration_hours, product_type)
    `)
    .eq('order_id', orderId)

  if (!items?.length) return

  type ActivateItem = {
    banner_id?: string | null
    listing_id?: string | null
    activation_date?: string | null
    product?: { duration_days?: number | null; duration_hours?: number | null } | null
  }

  await Promise.all(
    (items as ActivateItem[]).map(async (item) => {
      const product = item.product
      if (!product) return
      const durationMs =
        Number(product.duration_days || 0) * 86400000 +
        Number(product.duration_hours || 0) * 3600000

      const startsAt = item.activation_date ? new Date(item.activation_date) : new Date()
      const expiresAt = new Date(startsAt.getTime() + durationMs)

      if (item.banner_id) {
        await admin
          .from('banners')
          .update({
            status: 'active',
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.banner_id)
      } else if (item.listing_id) {
        await admin
          .from('job_listings')
          .update({
            status: 'active',
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.listing_id)
      }
    }),
  )
}
