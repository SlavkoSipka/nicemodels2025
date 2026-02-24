import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'model' || profile?.role === 'company') {
    if (!profile?.onboarding_completed) {
      redirect('/onboarding')
    }
  }

  switch (profile?.role) {
    case 'model':
      redirect('/dashboard/model')
    case 'company':
      redirect('/dashboard/company')
    case 'admin':
      redirect('/dashboard/admin')
    case 'user':
    default:
      redirect('/dashboard/user')
  }
}
