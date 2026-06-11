import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSedcardExpiringEmail, sendSedcardExpiredEmail } from '@/lib/email/templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Sedcard (ad_package) lifecycle emails:
 *   - reminder ~24h BEFORE the sedcard expires
 *   - notice once AFTER it has expired (and the model has no other active ad)
 *
 * A sedcard's expiry is computed from order_items: start (activation_date or
 * order.created_at) + product duration. Idempotency is guaranteed by the
 * `reminder_email_sent_at` / `expired_email_sent_at` columns on order_items
 * (see supabase-docs/ALTER-order-items-add-email-reminders.sql).
 *
 * Auth: header `x-cron-secret: <CRON_SECRET>` or `?cron_secret=...`.
 * Recommended schedule: hourly.
 */
export async function POST(req: NextRequest) {
  return run(req)
}
export async function GET(req: NextRequest) {
  return run(req)
}

const DAY_MS = 24 * 60 * 60 * 1000
const EXPIRED_GRACE_MS = 7 * DAY_MS // don't email about ads that expired long ago

interface AdItem {
  id: string
  activation_date: string | null
  reminder_email_sent_at: string | null
  expired_email_sent_at: string | null
  orders: { user_id: string; status: string; created_at: string } | null
  products: { product_type: string; duration_days: number | null; duration_hours: number | null } | null
}

async function run(req: NextRequest) {
  const provided =
    req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('cron_secret')
  const expected = process.env.CRON_SECRET
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('order_items')
    .select(`
      id,
      activation_date,
      reminder_email_sent_at,
      expired_email_sent_at,
      orders!inner(user_id, status, created_at),
      products!inner(product_type, duration_days, duration_hours)
    `)
    .eq('orders.status', 'paid')
    .eq('products.product_type', 'ad_package')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items = (data || []) as unknown as AdItem[]
  const now = new Date()

  // Compute expiry per item and group by user.
  type Computed = { item: AdItem; start: Date; expiry: Date }
  const byUser = new Map<string, Computed[]>()

  for (const item of items) {
    const order = item.orders
    const product = item.products
    if (!order || !product) continue
    const start = item.activation_date ? new Date(item.activation_date) : new Date(order.created_at)
    const durationMs =
      Number(product.duration_days || 0) * DAY_MS + Number(product.duration_hours || 0) * 3600000
    const expiry = new Date(start.getTime() + durationMs)
    const arr = byUser.get(order.user_id) || []
    arr.push({ item, start, expiry })
    byUser.set(order.user_id, arr)
  }

  if (byUser.size === 0) {
    return NextResponse.json({ ok: true, reminders: 0, expired: 0 })
  }

  // Load recipient profiles.
  const userIds = Array.from(byUser.keys())
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, username, is_blocked')
    .in('id', userIds)
  const profileById = new Map((profiles || []).map(p => [p.id, p]))

  const fmt: Intl.DateTimeFormatOptions = {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }
  const expiryLabel = (d: Date) => d.toLocaleDateString('en-CH', fmt)

  let reminders = 0
  let expiredSent = 0

  for (const [userId, computedList] of byUser) {
    const profile = profileById.get(userId)
    const hasActiveAd = computedList.some(c => c.start <= now && c.expiry > now)

    for (const { item, start, expiry } of computedList) {
      const started = start <= now
      const isActiveNow = started && expiry > now
      const isExpired = started && expiry <= now

      // ── Reminder: active, expiring within next 24h, not yet reminded ──
      if (isActiveNow && !item.reminder_email_sent_at) {
        const msToExpiry = expiry.getTime() - now.getTime()
        if (msToExpiry <= DAY_MS) {
          if (profile?.email && !profile.is_blocked) {
            await sendSedcardExpiringEmail({
              email: profile.email,
              userId,
              displayName: profile.username,
              expiryLabel: expiryLabel(expiry),
            })
            reminders++
          }
          await admin
            .from('order_items')
            .update({ reminder_email_sent_at: new Date().toISOString() })
            .eq('id', item.id)
        }
      }

      // ── Expired: just expired, not yet notified, user has no active ad ──
      if (isExpired && !item.expired_email_sent_at) {
        const recentlyExpired = now.getTime() - expiry.getTime() <= EXPIRED_GRACE_MS
        if (recentlyExpired && !hasActiveAd && profile?.email && !profile.is_blocked) {
          await sendSedcardExpiredEmail({
            email: profile.email,
            userId,
            displayName: profile.username,
            expiryLabel: expiryLabel(expiry),
          })
          expiredSent++
        }
        // Mark handled regardless (renewed / too old / sent) so we never re-scan it.
        await admin
          .from('order_items')
          .update({ expired_email_sent_at: new Date().toISOString() })
          .eq('id', item.id)
      }
    }
  }

  return NextResponse.json({ ok: true, reminders, expired: expiredSent })
}
