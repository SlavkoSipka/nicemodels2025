'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export default function UserOnboardingForm() {
  const router = useRouter()
  const t = useTranslations('onboarding.user')
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('welcome')}</h2>
        <p className="text-xl text-gray-600">{t('yourRole')} <span className="font-bold text-green-600">{t('roleUser')}</span></p>
      </div>

      <button
        onClick={handleComplete}
        disabled={loading}
        className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50"
      >
        {loading ? t('loading') : t('continueToDashboard')}
      </button>
    </div>
  )
}

