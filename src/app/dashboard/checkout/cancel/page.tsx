import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { XCircle, RotateCcw, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dashboardRootForRole } from '@/lib/dashboard/path'

interface PageProps {
  searchParams: Promise<{ session_id?: string }>
}

export const dynamic = 'force-dynamic'

export default async function CheckoutCancelPage({ searchParams }: PageProps) {
  const params = await searchParams
  const sessionId = params.session_id

  const t = await getTranslations('publicPages.checkout')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const dashboardRoot = dashboardRootForRole(profile?.role as string | null | undefined)

  let returnPath = dashboardRoot

  if (sessionId) {
    const { data: order } = await admin
      .from('orders')
      .select('id, status, metadata')
      .eq('stripe_session_id', sessionId)
      .eq('user_id', user.id)
      .single()
    const meta = (order?.metadata || {}) as { return_path?: string }
    if (typeof meta.return_path === 'string' && meta.return_path.startsWith('/')) {
      returnPath = meta.return_path
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 ml-0 md:ml-[280px] py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 bg-amber-50 text-center">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
              <XCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('checkoutCancelled')}</h1>
            <p className="text-sm text-gray-700">{t('checkoutCancelledDesc')}</p>
          </div>

          <div className="p-6 md:p-8 space-y-3">
            <Link
              href={returnPath}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
            >
              <RotateCcw className="w-4 h-4" /> {t('tryAgain')}
            </Link>
            <Link
              href={dashboardRoot}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
