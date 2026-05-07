import Link from 'next/link'
import { redirect } from 'next/navigation'
import { XCircle, RotateCcw, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface PageProps {
  searchParams: Promise<{ session_id?: string }>
}

export const dynamic = 'force-dynamic'

export default async function CheckoutCancelPage({ searchParams }: PageProps) {
  const params = await searchParams
  const sessionId = params.session_id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let returnPath = '/dashboard/model'

  if (sessionId) {
    const admin = createAdminClient()
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Checkout cancelled</h1>
            <p className="text-sm text-gray-700">
              No payment was taken. Your draft is being held briefly so you can
              try again, otherwise it will be cleaned up automatically.
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-3">
            <Link
              href={returnPath}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
            >
              <RotateCcw className="w-4 h-4" /> Try again
            </Link>
            <Link
              href="/dashboard/model"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
