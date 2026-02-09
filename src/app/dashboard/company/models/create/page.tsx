'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CompanySidebar from '@/components/layout/CompanySidebar'
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

  if (loading) {
    return (
      <>
        <CompanySidebar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <CompanySidebar />
      <div className="min-h-screen bg-gray-50 py-8 ml-[280px]">
        <ClubModelOnboardingForm clubId={user?.id} />
      </div>
    </>
  )
}

