'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/auth/AuthProvider'
import OpenInBrowserGate from '@/components/auth/OpenInBrowserGate'
import Navbar from '@/components/layout/Navbar'
import ModelOnboardingForm from '@/components/onboarding/ModelOnboardingForm'
import CompanyOnboardingForm from '@/components/onboarding/CompanyOnboardingForm'
import UserOnboardingForm from '@/components/onboarding/UserOnboardingForm'
import OnboardingFooter from '@/components/onboarding/OnboardingFooter'

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('onboarding')
  const { user, profile, isLoading: authLoading, profileError, refreshProfile } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [stuckTooLong, setStuckTooLong] = useState(false)
  const welcomeRequested = useRef(false)

  // Decide what to do once auth + profile resolve.
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (!profile) return // wait for AuthProvider to load it

    if (profile.role === 'user') {
      router.push('/dashboard/user')
      return
    }
    if (profile.onboarding_completed) {
      if (profile.role === 'model') router.push('/dashboard/model')
      else if (profile.role === 'company') router.push('/dashboard/company')
      else router.push('/dashboard')
      return
    }
    setUserRole(profile.role || 'user')
  }, [authLoading, user, profile, router])

  // One-time welcome email when onboarding form is shown (model / club).
  useEffect(() => {
    if (!userRole || welcomeRequested.current) return
    if (userRole !== 'model' && userRole !== 'company') return
    welcomeRequested.current = true
    fetch('/api/email/welcome', { method: 'POST' }).catch(() => {})
  }, [userRole])

  // If the page hasn't resolved (no role, no redirect) after 10s, surface
  // the retry UI. Covers all stuck states: auth hanging, profile missing, etc.
  useEffect(() => {
    if (userRole) return
    const id = setTimeout(() => setStuckTooLong(true), 10000)
    return () => clearTimeout(id)
  }, [userRole])

  const handleRetry = () => {
    setStuckTooLong(false)
    refreshProfile().catch(() => {})
  }

  const handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  const showLoader = !userRole && !stuckTooLong && !profileError

  return (
    <OpenInBrowserGate>
      {showLoader && (
        <>
          <Navbar />
          <div className="h-dvh overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50">
            <div className="flex-1 flex items-center justify-center px-4 py-6">
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl px-8 py-10 max-w-md w-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600 mx-auto" />
                <p className="mt-4 text-sm text-gray-600">{t('preparing')}</p>
              </div>
            </div>
            <OnboardingFooter />
          </div>
        </>
      )}

      {!userRole && (stuckTooLong || profileError) && (
        <>
          <Navbar />
          <div className="h-dvh overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50">
            <div className="flex-1 flex items-center justify-center px-4 py-6">
              <div className="text-center bg-white rounded-2xl shadow-xl px-6 py-8 max-w-md w-full">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-2.99l-7.07-12.25a2 2 0 00-3.48 0L3.19 16.01A2 2 0 004.93 19z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Connection is slow</h2>
                <p className="text-sm text-gray-600 mb-4">
                  We couldn&apos;t load your profile. Try again, or reload the page.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRetry}
                    className="w-full py-2.5 text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors"
                  >
                    Try again
                  </button>
                  <button
                    onClick={handleReload}
                    className="w-full py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Reload page
                  </button>
                </div>
              </div>
            </div>
            <OnboardingFooter />
          </div>
        </>
      )}

      {userRole && (
        <>
          <Navbar />
          <div className="h-dvh overflow-hidden bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[env(safe-area-inset-bottom,0px)] flex justify-center min-h-0">
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

                {/* Spacer so the bottom of the form (Finish button) can always scroll above the fixed footer on mobile */}
                <div aria-hidden="true" className="h-[80dvh] md:h-40" />
              </div>
            </div>
            <OnboardingFooter />
          </div>
        </>
      )}
    </OpenInBrowserGate>
  )
}
