import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role: 'model' | 'company' | 'user' | 'admin' =
    profile?.role === 'company' || profile?.role === 'user' || profile?.role === 'admin'
      ? profile.role
      : 'model'

  return (
    <>
      <DashboardSidebar userRole={role} />
      <div className="pt-14 md:pt-0">
        {children}
      </div>
    </>
  )
}
