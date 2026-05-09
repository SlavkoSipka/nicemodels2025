import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { CheckCircle, Receipt, ArrowRight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface PageProps {
  searchParams: Promise<{ session_id?: string }>
}

export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams
  const sessionId = params.session_id
  if (!sessionId) redirect('/dashboard/model')

  const t = await getTranslations('publicPages.checkout')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Read with the service role so we can see freshly-paid (or still-pending)
  // orders without depending on RLS recency.
  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select(`
      id, status, total_amount, paid_at, payment_method, stripe_receipt_url,
      order_items(id, product:products(name, product_type, duration_days))
    `)
    .eq('stripe_session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 ml-0 md:ml-[280px] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('orderNotFound')}</h1>
          <p className="text-sm text-gray-600 mb-6">{t('orderNotFoundDesc')}</p>
          <Link
            href="/dashboard/model/purchase-history"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
          >
            {t('viewPurchaseHistory')}
          </Link>
        </div>
      </div>
    )
  }

  const isPaid = order.status === 'paid'
  // Stripe sometimes confirms via webhook a couple of seconds after redirect;
  // we keep the page accurate by showing a "processing" state for non-paid.

  return (
    <div className="min-h-screen bg-gray-50 ml-0 md:ml-[280px] py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className={`p-6 md:p-8 text-center ${isPaid ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
              {isPaid
                ? <CheckCircle className="w-8 h-8 text-emerald-600" />
                : <Clock className="w-8 h-8 text-amber-600" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {isPaid ? t('paymentSuccessful') : t('paymentProcessing')}
            </h1>
            <p className="text-sm text-gray-700">
              {isPaid ? t('paymentSuccessfulDesc') : t('paymentProcessingDesc')}
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t('order')}</p>
              <p className="text-sm text-gray-900 font-mono">{order.id}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('items')}</p>
              <ul className="space-y-2">
                {(order.order_items || []).map((it: any) => (
                  <li key={it.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">
                      {it.product?.name || t('itemFallback')}
                      <span className="text-xs text-gray-500 ml-2">
                        ({(it.product?.product_type || '').replace('_', ' ')})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="text-sm font-bold text-gray-900">{t('total')}</p>
              <p className="text-base font-bold text-gray-900">
                CHF {Number(order.total_amount || 0).toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t('paymentMethod')}</span>
              <span className="font-semibold text-gray-700 uppercase">{order.payment_method}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {order.stripe_receipt_url && (
                <a
                  href={order.stripe_receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200"
                >
                  <Receipt className="w-4 h-4" /> {t('viewReceipt')}
                </a>
              )}
              <Link
                href="/dashboard/model/purchase-history"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
              >
                {t('purchaseHistory')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
