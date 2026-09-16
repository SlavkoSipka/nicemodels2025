import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SedcardState = { expiresAt: string; visible: boolean }

/**
 * Which models/clubs currently have a running ad package ("sedcard online").
 * Mirrors the expiry math in models_with_active_ads() / clubs_with_active_ads(),
 * but also reports rows that are paid yet invisible on the public site — the
 * case the admin list has to tell apart from "no package at all".
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: caller } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = request.nextUrl.searchParams.get('role')
    if (role !== 'model' && role !== 'company') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: items, error } = await admin
      .from('order_items')
      .select('activation_date, orders!inner(user_id, status, created_at), products!inner(product_type, duration_days, duration_hours)')
      .eq('orders.status', 'paid')
      .eq('products.product_type', 'ad_package')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const nowMs = Date.now()
    const expiryByUser = new Map<string, number>()

    for (const row of (items as any[]) || []) {
      const order = row.orders
      const product = row.products
      if (!order || !product) continue
      const start = row.activation_date ? new Date(row.activation_date) : new Date(order.created_at)
      const durationMs =
        Number(product.duration_days || 0) * 86400000 +
        Number(product.duration_hours || 0) * 3600000
      const expiry = start.getTime() + durationMs
      if (start.getTime() > nowMs || expiry <= nowMs) continue
      const prev = expiryByUser.get(order.user_id)
      if (prev === undefined || expiry > prev) expiryByUser.set(order.user_id, expiry)
    }

    const ids = [...expiryByUser.keys()]
    const hiddenIds = new Set<string>()
    if (ids.length > 0 && role === 'model') {
      const { data: details } = await admin
        .from('model_details')
        .select('model_id, sedcard_visible')
        .in('model_id', ids)
      const seen = new Set<string>()
      for (const d of (details as any[]) || []) {
        seen.add(d.model_id)
        if (!d.sedcard_visible) hiddenIds.add(d.model_id)
      }
      // models_with_active_ads() INNER JOINs model_details, so a model without
      // that row never reaches the public listing either.
      for (const id of ids) if (!seen.has(id)) hiddenIds.add(id)
    }
    if (ids.length > 0 && role === 'company') {
      // Clubs have no private switch, but clubs_with_active_ads() JOINs
      // club_details and requires onboarding_completed — a club missing either
      // pays for a package nobody can see. Blocking is judged client-side.
      const [{ data: details }, { data: profiles }] = await Promise.all([
        admin.from('club_details').select('club_id').in('club_id', ids),
        admin.from('profiles').select('id, onboarding_completed').in('id', ids),
      ])
      const withDetails = new Set(((details as any[]) || []).map(d => d.club_id))
      const onboarded = new Set(((profiles as any[]) || []).filter(p => p.onboarding_completed).map(p => p.id))
      for (const id of ids) if (!withDetails.has(id) || !onboarded.has(id)) hiddenIds.add(id)
    }

    const sedcards: Record<string, SedcardState> = {}
    for (const [id, expiry] of expiryByUser) {
      sedcards[id] = {
        expiresAt: new Date(expiry).toISOString(),
        visible: !hiddenIds.has(id),
      }
    }

    return NextResponse.json({ sedcards })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
