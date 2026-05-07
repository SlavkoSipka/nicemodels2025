import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/server'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
// We need the raw body to verify the Stripe signature; disable Next's body
// parsing for this route.
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const sigHeader = (await headers()).get('stripe-signature')
  if (!sigHeader) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const rawBody = await req.text()
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sigHeader, secret)
  } catch (e: any) {
    console.error('[stripe/webhook] signature verification failed:', e?.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
        await handleCheckoutCancelled(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      // Charge refunded — we don't auto-deactivate banners/listings here;
      // admins handle that manually via the admin dashboard.
      default:
        // Ignore other events but acknowledge so Stripe stops retrying.
        break
    }
  } catch (e: any) {
    console.error(`[stripe/webhook] handler ${event.type} failed:`, e)
    // Returning 500 makes Stripe retry; only do this if we believe it's a
    // transient failure. Persist the error and return 200 so we don't loop
    // forever on bad data.
    return NextResponse.json({ received: true, warning: e?.message }, { status: 200 })
  }

  return NextResponse.json({ received: true })
}

// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const admin = createAdminClient()
  const orderId = session.metadata?.order_id || session.client_reference_id
  if (!orderId) {
    console.warn('[stripe/webhook] checkout.session.completed without order_id')
    return
  }

  const { data: order } = await admin
    .from('orders')
    .select('id, status, user_id')
    .eq('id', orderId)
    .single()
  if (!order) {
    console.warn('[stripe/webhook] order not found for', orderId)
    return
  }

  // Idempotent — already processed.
  if (order.status === 'paid') return

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  // Pull the receipt URL from the latest charge so the user can re-download
  // their invoice from purchase history.
  let receiptUrl: string | null = null
  let paymentMethodLabel = 'card'
  if (paymentIntentId) {
    try {
      const stripe = getStripe()
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge'],
      })
      const charge = pi.latest_charge as Stripe.Charge | null
      receiptUrl = charge?.receipt_url ?? null
      const pmTypes = pi.payment_method_types || []
      if (pmTypes.includes('twint')) paymentMethodLabel = 'twint'
      else if (pmTypes.includes('card')) paymentMethodLabel = 'card'
      else paymentMethodLabel = pmTypes[0] || 'card'
    } catch (e) {
      console.warn('[stripe/webhook] failed to expand payment intent:', e)
    }
  }

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

  const { error: updErr } = await admin
    .from('orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
      stripe_receipt_url: receiptUrl,
      payment_method: paymentMethodLabel,
    })
    .eq('id', orderId)
  if (updErr) {
    throw new Error(`Failed to mark order paid: ${updErr.message}`)
  }

  await activateOrderItems(admin, orderId)
}

async function handleCheckoutCancelled(session: Stripe.Checkout.Session) {
  const admin = createAdminClient()
  const orderId = session.metadata?.order_id || session.client_reference_id
  if (!orderId) return

  const { data: order } = await admin
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single()
  if (!order || order.status === 'paid') return

  await admin
    .from('orders')
    .update({ status: 'cancelled', failed_at: new Date().toISOString() })
    .eq('id', orderId)

  // Mark associated drafts as cancelled so the cleanup job doesn't have to
  // wait 24h. Image files in storage are left for an admin to prune.
  const { data: items } = await admin
    .from('order_items')
    .select('banner_id, listing_id')
    .eq('order_id', orderId)

  const bannerIds = (items || []).map(i => i.banner_id).filter(Boolean) as string[]
  const listingIds = (items || []).map(i => i.listing_id).filter(Boolean) as string[]

  if (bannerIds.length) {
    await admin
      .from('banners')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .in('id', bannerIds)
      .eq('status', 'pending_payment')
  }
  if (listingIds.length) {
    await admin
      .from('job_listings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .in('id', listingIds)
      .eq('status', 'pending_payment')
  }
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  const admin = createAdminClient()
  const orderId = pi.metadata?.order_id
  if (!orderId) return
  await admin
    .from('orders')
    .update({ failed_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'pending')
}

/**
 * Flip every order_items row's side-table draft from pending_payment to
 * active and apply the proper starts_at / expires_at window.
 *
 * Uses the product's duration; activation_date overrides "now" if present
 * (scheduled activations).
 */
async function activateOrderItems(admin: ReturnType<typeof createAdminClient>, orderId: string) {
  const { data: items } = await admin
    .from('order_items')
    .select(`
      id, banner_id, listing_id, activation_type, activation_date,
      product:products(duration_days, duration_hours, product_type)
    `)
    .eq('order_id', orderId)

  if (!items?.length) return

  for (const item of items as any[]) {
    const product = item.product
    if (!product) continue
    const durationMs =
      Number(product.duration_days || 0) * 86400000 +
      Number(product.duration_hours || 0) * 3600000

    const startsAt = item.activation_date
      ? new Date(item.activation_date)
      : new Date()
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
    // ad_package items don't need a side-table flip — `checkActiveAd`
    // derives status from the paid order alone.
  }
}
