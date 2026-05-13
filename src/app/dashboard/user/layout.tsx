import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()

  if (profile?.role && profile.role !== 'user') {
    redirect('/dashboard')
  }

  return (
    <>
      <DashboardSidebar userRole="user" />
      <div className="pt-14 md:pt-0">
        {children}
      </div>
    </>
  )
}
