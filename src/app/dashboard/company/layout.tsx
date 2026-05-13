import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default async function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'company') redirect('/dashboard')
  if (!profile?.onboarding_completed) redirect('/onboarding')

  return (
    <>
      <DashboardSidebar userRole="company" />
      <div className="pt-14 md:pt-0">
        {children}
      </div>
    </>
  )
}
