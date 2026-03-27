'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ClubModelOnboardingForm from '@/components/onboarding/ClubModelOnboardingForm'

export default function CreateModelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is a company
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'company') {
        router.push('/dashboard')
        return
      }

      setUser(user)
      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading) return null

  return (
      <div className="min-h-screen bg-gray-50 py-4 md:py-8 ml-0 md:ml-[280px]">
        <ClubModelOnboardingForm clubId={user?.id} />
      </div>
  )
}

