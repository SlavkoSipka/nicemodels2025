import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/server'
import { findBannerPrice, fetchBannerRegionPricing } from '@/lib/bannerPricing'
import { isValidCanton, MAX_BANNER_REGIONS } from '@/lib/cantons'
import { normalizePlacement } from '@/lib/bannerPlacement'
import type {
  CheckoutCartItem,
  CheckoutSessionRequestBody,
  CheckoutSessionResponseBody,
} from '@/lib/stripe/types'
// Inferred from the Stripe SDK rather than imported as a named type — the
// SDK re-exports SessionCreateParams as a type alias which makes inner
// namespace members (LineItem, etc.) tricky to import. Inference avoids
// that whole class of TS errors.
type StripeClient = ReturnType<typeof getStripe>
type CheckoutSession = Awaited<ReturnType<StripeClient['checkout']['sessions']['create']>>

export const runtime = 'nodejs'

// Server-trusted product/price snapshot used when building Stripe line items
// and persisting order_items. We never trust amounts coming from the client.
interface ResolvedItem {
  cartItem: CheckoutCartItem
  productId: string
  productName: string
  durationDays: number
  durationHours: number
  amountChf: number
  metadata: Record<string, string>
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://nicemodels.ch'
  ).replace(/\/$/, '')
}

export async function POST(req: NextRequest) {
  let body: CheckoutSessionRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body?.items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }
  if (body.items.length > 10) {
    return NextResponse.json({ error: 'Too many items' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Use the service role to read pricing tables and write the order; we can't
  // trust the client's RLS context for cross-table linkage, and the user's
  // session already validated who they are.
  const admin = createAdminClient()

  // Fetch all referenced products in one round-trip.
  const productIds = Array.from(new Set(body.items.map(i => i.productId)))
  const { data: products, error: prodErr } = await admin
    .from('products')
    .select('id, product_type, name, price_chf, duration_days, duration_hours, is_active')
    .in('id', productIds)

  if (prodErr || !products) {
    return NextResponse.json(
      { error: 'Failed to load products' },
      { status: 500 },
    )
  }
  const productMap = new Map(products.map(p => [p.id, p]))

  // Banner pricing matrix only needed if there's at least one banner item.
  const hasBanner = body.items.some(i => i.kind === 'banner')
  const bannerPricing = hasBanner
    ? await fetchBannerRegionPricing(admin)
    : []

  let resolved: ResolvedItem[]
  try {
    resolved = body.items.map(item => resolveItem(item, productMap, bannerPricing))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  // Sanity check that all owned drafts (banner_id, listing_id) actually
  // belong to this user — protects against forged IDs in the request.
  const claimedBannerIds = resolved
    .filter(r => r.cartItem.kind === 'banner')
    .map(r => (r.cartItem as any).bannerId)
    .filter(Boolean)
  const claimedListingIds = resolved
    .filter(r => r.cartItem.kind === 'job_listing')
    .map(r => (r.cartItem as any).listingId)
    .filter(Boolean)

  if (claimedListingIds.length) {
    const { data: own } = await admin
      .from('job_listings')
      .select('id, club_id, status')
      .in('id', claimedListingIds)
    for (const l of own || []) {
      if (l.club_id !== user.id) {
        return NextResponse.json({ error: 'Listing ownership mismatch' }, { status: 403 })
      }
      if (l.status !== 'pending_payment') {
        return NextResponse.json({ error: 'Listing already activated' }, { status: 409 })
      }
    }
  }
  if (claimedBannerIds.length) {
    const { data: own } = await admin
      .from('banners')
      .select('id, owner_id, status')
      .in('id', claimedBannerIds)
    for (const b of own || []) {
      if (b.owner_id !== user.id) {
        return NextResponse.json({ error: 'Banner ownership mismatch' }, { status: 403 })
      }
      if (b.status !== 'pending_payment') {
        return NextResponse.json({ error: 'Banner already activated' }, { status: 409 })
      }
    }
  }

  // ---------- Insert pending order + items ----------------------------------
  const totalChf = resolved.reduce((s, r) => s + r.amountChf, 0)
  if (totalChf <= 0) {
    return NextResponse.json(
      { error: 'Total amount must be positive' },
      { status: 400 },
    )
  }

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      total_amount: totalChf,
      // Placeholder — the Stripe webhook will overwrite this with the actual
      // method ('card' or 'twint') once the payment_intent succeeds.
      payment_method: 'card',
      metadata: {
        return_path: body.returnPath || null,
        items_summary: resolved.map(r => ({
          kind: r.cartItem.kind,
          name: r.productName,
          chf: r.amountChf,
        })),
      },
    })
    .select()
    .single()

  if (orderErr || !order) {
    return NextResponse.json(
      { error: orderErr?.message || 'Failed to create order' },
      { status: 500 },
    )
  }

  const itemRows = resolved.map(r => {
    const c = r.cartItem
    const base: Record<string, any> = {
      order_id: order.id,
      product_id: r.productId,
      price_chf: r.amountChf,
      activation_type:
        c.kind === 'banner' ? 'immediately' : (c as any).activationType ?? 'immediately',
      activation_date:
        c.kind !== 'banner' && (c as any).activationDate
          ? new Date((c as any).activationDate).toISOString()
          : null,
    }
    if (c.kind === 'banner') {
      base.banner_id = (c as any).bannerId ?? null
      base.banner_file_path = c.imagePath
    } else if (c.kind === 'job_listing') {
      base.listing_id = c.listingId
    }
    return base
  })

  const { error: itemsErr } = await admin.from('order_items').insert(itemRows)
  if (itemsErr) {
    // Roll back the half-created order so retries work.
    await admin.from('orders').delete().eq('id', order.id)
    return NextResponse.json(
      { error: itemsErr.message || 'Failed to create order items' },
      { status: 500 },
    )
  }

  // ---------- Create Stripe Checkout Session --------------------------------
  const stripe = getStripe()
  const lineItems = resolved.map(r => ({
    price_data: {
      currency: 'chf' as const,
      product_data: {
        name: r.productName,
        metadata: r.metadata,
      },
      unit_amount: Math.round(r.amountChf * 100),
    },
    quantity: 1,
  }))

  const base = siteUrl()
  let session: CheckoutSession
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Don't hard-code payment_method_types — Stripe automatically uses
      // whichever methods are enabled in the Dashboard for the account
      // (card today, TWINT/Apple Pay/etc. once activated). This avoids
      // crashing the checkout when a method isn't yet enabled.
      line_items: lineItems,
      currency: 'chf',
      customer_email: user.email ?? undefined,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        user_id: user.id,
      },
      success_url: `${base}/dashboard/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/dashboard/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: false,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 12, // 12h
    })
  } catch (e: any) {
    await admin.from('orders').delete().eq('id', order.id)
    return NextResponse.json(
      { error: e?.message || 'Stripe error' },
      { status: 502 },
    )
  }

  await admin
    .from('orders')
    .update({ stripe_session_id: session.id })
    .eq('id', order.id)

  if (!session.url) {
    return NextResponse.json(
      { error: 'Stripe session has no URL' },
      { status: 502 },
    )
  }

  const res: CheckoutSessionResponseBody = { url: session.url, orderId: order.id }
  return NextResponse.json(res)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveItem(
  item: CheckoutCartItem,
  products: Map<string, any>,
  bannerPricing: Awaited<ReturnType<typeof fetchBannerRegionPricing>>,
): ResolvedItem {
  const product = products.get(item.productId)
  if (!product || !product.is_active) {
    throw new Error('Product not available')
  }

  if (item.kind === 'ad_package') {
    if (product.product_type !== 'ad_package') {
      throw new Error('Product type mismatch for ad package')
    }
    const amount = Number(product.price_chf || 0)
    if (amount <= 0) throw new Error('Ad package has no price')
    return {
      cartItem: item,
      productId: product.id,
      productName: `Sedcard activation — ${product.name}`,
      durationDays: product.duration_days,
      durationHours: product.duration_hours || 0,
      amountChf: amount,
      metadata: {
        kind: 'ad_package',
        duration_days: String(product.duration_days),
      },
    }
  }

  if (item.kind === 'banner') {
    if (product.product_type !== 'banner_package') {
      throw new Error('Product type mismatch for banner package')
    }
    const placement = normalizePlacement(item.placement)
    const cantons = (item.targetCantons || []).filter(isValidCanton)
    if (cantons.length < 1 || cantons.length > MAX_BANNER_REGIONS) {
      throw new Error(`Pick between 1 and ${MAX_BANNER_REGIONS} regions`)
    }
    if (!item.imagePath) throw new Error('Banner image is missing')

    // Pricing is fixed at the 4-region tier per business rules.
    const price = findBannerPrice(bannerPricing, placement, product.duration_days, MAX_BANNER_REGIONS)
    if (price == null || price <= 0) {
      throw new Error('Banner pricing not configured')
    }

    return {
      cartItem: item,
      productId: product.id,
      productName: `${labelForPlacement(placement)} banner — ${product.name}`,
      durationDays: product.duration_days,
      durationHours: product.duration_hours || 0,
      amountChf: price,
      metadata: {
        kind: 'banner',
        placement,
        duration_days: String(product.duration_days),
        cantons: cantons.join(','),
      },
    }
  }

  if (item.kind === 'job_listing') {
    if (product.product_type !== 'job_package') {
      throw new Error('Product type mismatch for job package')
    }
    const amount = Number(product.price_chf || 0)
    if (amount <= 0) throw new Error('Job package has no price')
    if (!item.listingId) throw new Error('Listing draft is missing')

    return {
      cartItem: item,
      productId: product.id,
      productName: `Listing — ${product.name}`,
      durationDays: product.duration_days,
      durationHours: product.duration_hours || 0,
      amountChf: amount,
      metadata: {
        kind: 'job_listing',
        duration_days: String(product.duration_days),
        listing_id: item.listingId,
      },
    }
  }

  throw new Error('Unknown cart item kind')
}

function labelForPlacement(p: 'feed_wide' | 'feed_card' | 'sidebar_left'): string {
  if (p === 'feed_card') return 'Card slot'
  if (p === 'sidebar_left') return 'Left column'
  return 'Wide'
}
