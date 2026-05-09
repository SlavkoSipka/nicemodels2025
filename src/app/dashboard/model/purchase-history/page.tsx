'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, Clock, CheckCircle, XCircle, Calendar, Package, Receipt, CreditCard } from 'lucide-react'

interface OrderItem {
  id: string; price_chf: number; activation_type?: string; activation_date?: string
  banner_file_path?: string; advertising_text?: string; created_at: string
  product: { id: string; product_type: string; name: string; description: string; duration_days: number }
}

interface Order {
  id: string
  total_amount: number
  status: string
  payment_method: string
  created_at: string
  paid_at: string | null
  stripe_receipt_url: string | null
  order_items: OrderItem[]
}

export default function PurchaseHistoryPage() {
  const supabase = createClient()
  const t = useTranslations('dashboard.model.purchaseHistory')
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all')

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('orders')
        .select('id, total_amount, status, payment_method, created_at, paid_at, stripe_receipt_url, order_items(*, product:products(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
    } catch { }
    finally { setLoading(false) }
  }

  const statusBadge = (status: string) => {
    const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold'
    if (status === 'paid') return <span className={`${base} bg-emerald-100 text-emerald-700`}><CheckCircle className="w-3 h-3" />{t('statusPaid')}</span>
    if (status === 'pending') return <span className={`${base} bg-amber-100 text-amber-700`}><Clock className="w-3 h-3" />{t('statusPending')}</span>
    if (status === 'cancelled') return <span className={`${base} bg-red-100 text-red-700`}><XCircle className="w-3 h-3" />{t('statusCancelled')}</span>
    return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>
  }

  const methodLabel = (method: string | null | undefined) => {
    const m = (method || '').toLowerCase()
    if (m === 'twint') return t('methodTwint')
    if (m === 'card') return t('methodCard')
    if (m === 'stripe') return t('methodStripe')
    return method || '—'
  }

  const productTypeBadge = (type: string) => {
    if (type === 'ad_package') return { cls: 'bg-brand/10 text-brand', label: t('badgeSedcard') }
    if (type === 'banner_package') return { cls: 'bg-violet-100 text-violet-700', label: t('badgeBanner') }
    if (type === 'job_package') return { cls: 'bg-emerald-100 text-emerald-700', label: t('badgeListing') }
    return { cls: 'bg-gray-100 text-gray-700', label: type.toUpperCase() }
  }

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter)

  const filterBtn = (val: typeof filter, label: string, activeColor: string) => (
    <button onClick={() => setFilter(val)}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${filter === val ? activeColor : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
      {label}
    </button>
  )

  if (loading) return null

  return (
    <div className="flex-1 p-4 md:p-6 ml-0 md:ml-[280px] bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-xs text-gray-500">{t('subtitle')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filterBtn('all', t('filterAll'), 'bg-brand text-white')}
          {filterBtn('paid', t('filterPaid'), 'bg-emerald-600 text-white')}
          {filterBtn('pending', t('filterPending'), 'bg-amber-500 text-white')}
          {filterBtn('cancelled', t('filterCancelled'), 'bg-red-600 text-white')}
        </div>

        {/* Orders */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600 mb-1">{t('noOrders')}</p>
            <p className="text-xs text-gray-400">
              {filter === 'all' ? t('noOrdersHintAll') : t('noOrdersHintFilter', { status: filter })}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">
                        {new Date(order.paid_at || order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs font-bold text-gray-900">
                      CHF {Number(order.total_amount || 0).toFixed(2)}
                    </span>
                    {order.payment_method && (
                      <>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
                          <CreditCard className="w-3 h-3" />
                          {methodLabel(order.payment_method)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {order.stripe_receipt_url && (
                      <a
                        href={order.stripe_receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-brand hover:underline"
                      >
                        <Receipt className="w-3 h-3" /> {t('receipt')}
                      </a>
                    )}
                    {statusBadge(order.status)}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {order.order_items.map((item: OrderItem) => {
                    const badge = productTypeBadge(item.product.product_type)
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badge.cls}`}>
                              {badge.label}
                            </span>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.product.name}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {item.product.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-bold text-gray-900">CHF {Number(item.price_chf || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400">{t('durationDays', { days: item.product.duration_days })}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
