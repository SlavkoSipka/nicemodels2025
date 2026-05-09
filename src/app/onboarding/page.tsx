'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import ModelOnboardingForm from '@/components/onboarding/ModelOnboardingForm'
import CompanyOnboardingForm from '@/components/onboarding/CompanyOnboardingForm'
import UserOnboardingForm from '@/components/onboarding/UserOnboardingForm'
import OnboardingFooter from '@/components/onboarding/OnboardingFooter'

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('onboarding')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', user.id)
        .single()

      // Regular users don't need onboarding, redirect to user dashboard
      if (profile?.role === 'user') {
        router.push('/dashboard/user')
        return
      }

      if (profile?.onboarding_completed) {
        // Already completed onboarding, redirect to dashboard
        if (profile.role === 'model') {
          router.push('/dashboard/model')
        } else if (profile.role === 'company') {
          router.push('/dashboard/company')
        } else {
          router.push('/dashboard')
        }
        return
      }

      setUserRole(profile?.role || 'user')
      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50">
          <div className="flex-1 flex items-center justify-center px-4 py-6 pb-32 md:pb-20">
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl px-8 py-10 max-w-md w-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">{t('preparing')}</p>
            </div>
          </div>
          <OnboardingFooter />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50 flex flex-col">
        {/* pb-32 on mobile so the fixed footer (which wraps to two lines on
            small screens) doesn't overlap the form's submit button. */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 md:pb-20 flex justify-center">
          <div className="max-w-5xl w-full">
            <div className="text-center mb-3">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                {t('welcome')}<span className="text-pink-600">nicemodels.ch</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-600 max-w-2xl mx-auto">
                {t.rich('subtitle', {
                  model: (chunks) => <span className="font-semibold">{chunks}</span>,
                  club: (chunks) => <span className="font-semibold">{chunks}</span>,
                })}
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl px-4 py-4 md:px-8 md:py-5">
              {userRole === 'model' && <ModelOnboardingForm />}
              {userRole === 'company' && <CompanyOnboardingForm />}
              {userRole === 'user' && <UserOnboardingForm />}
            </div>
          </div>
        </div>
        <OnboardingFooter />
      </div>
    </>
  )
}

