import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin, parseRange, rangeToDate, bucketByDay } from '@/lib/adminApi'

export const runtime = 'nodejs'

const LIMIT_ROWS = 20000

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const range = parseRange(url)
  const since = rangeToDate(range)
  const sinceIso = since ? since.toISOString() : null

  const admin = createAdminClient()

  let q = admin
    .from('orders')
    .select('id,total_amount,status,payment_method,created_at,user_id,order_items(id,price_chf,product:products(id,name,product_type))')
    .limit(LIMIT_ROWS)
    .order('created_at', { ascending: false })
  if (sinceIso) q = q.gte('created_at', sinceIso)
  const { data: orders } = await q

  const list = (orders || []) as any[]

  // totals
  const totalRevenue = list.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const paidOrders = list.filter(o => o.status === 'paid').length
  const pendingOrders = list.filter(o => o.status === 'pending').length
  const cancelledOrders = list.filter(o => o.status === 'cancelled').length
  const avgOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0

  // series: revenue per day (paid)
  const dayMap: Record<string, { date: string; revenue: number; orders: number }> = {}
  const paidList = list.filter(o => o.status === 'paid')
  const skel = bucketByDay(paidList, since)
  for (const s of skel) dayMap[s.date] = { date: s.date, revenue: 0, orders: 0 }
  for (const o of paidList) {
    const d = o.created_at.slice(0, 10)
    if (!dayMap[d]) dayMap[d] = { date: d, revenue: 0, orders: 0 }
    dayMap[d].revenue += Number(o.total_amount || 0)
    dayMap[d].orders += 1
  }
  const series = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date))

  // Revenue by product type
  const byProductType: Record<string, { revenue: number; count: number }> = {}
  for (const o of paidList) {
    for (const it of o.order_items || []) {
      const type = it.product?.product_type || 'other'
      if (!byProductType[type]) byProductType[type] = { revenue: 0, count: 0 }
      byProductType[type].revenue += Number(it.price_chf || 0)
      byProductType[type].count += 1
    }
  }

  // Top products
  const productTotals = new Map<string, { name: string; type: string; revenue: number; count: number }>()
  for (const o of paidList) {
    for (const it of o.order_items || []) {
      const id = it.product?.id
      if (!id) continue
      const prev = productTotals.get(id)
      if (prev) {
        prev.revenue += Number(it.price_chf || 0)
        prev.count += 1
      } else {
        productTotals.set(id, {
          name: it.product.name || 'Product',
          type: it.product.product_type || 'other',
          revenue: Number(it.price_chf || 0),
          count: 1,
        })
      }
    }
  }
  const topProducts = [...productTotals.values()].sort((a, b) => b.revenue - a.revenue || b.count - a.count).slice(0, 10)

  // Payment methods
  const paymentMethods: Record<string, number> = {}
  for (const o of paidList) {
    const m = o.payment_method || 'unknown'
    paymentMethods[m] = (paymentMethods[m] || 0) + 1
  }

  return NextResponse.json({
    range,
    kpis: {
      totalRevenue,
      paidOrders,
      pendingOrders,
      cancelledOrders,
      avgOrderValue: +avgOrderValue.toFixed(2),
    },
    series,
    byProductType,
    topProducts,
    paymentMethods,
    recentOrders: list.slice(0, 10).map(o => ({
      id: o.id,
      total: Number(o.total_amount || 0),
      status: o.status,
      method: o.payment_method,
      created_at: o.created_at,
    })),
  })
}
