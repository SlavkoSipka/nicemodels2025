import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { activateOrderItems } from '@/lib/orders/activateOrderItems'

export const runtime = 'nodejs'

/**
 * Admin grant: activates a sedcard (ad package) for a model without payment.
 * Creates a paid order + order_item exactly like the free-activation path so
 * the model's "active ad" is detected everywhere the same way.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: caller } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { modelId, productId } = await request.json()
    if (!modelId || !productId) {
      return NextResponse.json({ error: 'Missing modelId or productId' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: target } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', modelId)
      .maybeSingle()
    if (!target) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }
    if (target.role !== 'model') {
      return NextResponse.json({ error: 'Target is not a model' }, { status: 400 })
    }

    const { data: product } = await admin
      .from('products')
      .select('id, product_type, name, duration_days, duration_hours')
      .eq('id', productId)
      .maybeSingle()
    if (!product || product.product_type !== 'ad_package') {
      return NextResponse.json({ error: 'Invalid ad package' }, { status: 400 })
    }

    const nowIso = new Date().toISOString()

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        user_id: modelId,
        status: 'paid',
        total_amount: 0,
        payment_method: 'card',
        paid_at: nowIso,
        metadata: {
          admin_granted: true,
          granted_by: user.id,
          items_summary: [{ kind: 'ad_package', name: product.name, chf: 0 }],
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

    const { error: itemErr } = await admin.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      price_chf: 0,
      activation_type: 'immediately',
      activation_date: nowIso,
    })

    if (itemErr) {
      await admin.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: itemErr.message || 'Failed to create order item' },
        { status: 500 },
      )
    }

    await activateOrderItems(admin, order.id)

    const durationMs =
      Number(product.duration_days || 0) * 86400000 +
      Number(product.duration_hours || 0) * 3600000
    const expiresAt = new Date(Date.now() + durationMs).toISOString()

    return NextResponse.json({ ok: true, expiresAt })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
