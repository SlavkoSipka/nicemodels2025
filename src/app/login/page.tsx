'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

function LoginFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth.login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifiedMessage, setVerifiedMessage] = useState(false)

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerifiedMessage(true)
      setTimeout(() => setVerifiedMessage(false), 5000)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (!authError.message.includes('Refresh Token Not Found')) {
          throw authError
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, role')
        .eq('id', data.user?.id)
        .single()

      if (!profile) {
        setError(t('errorProfileNotFound'))
        return
      }

      let effectiveRole = profile.role

      if (profile.role === 'user') {
        try {
          const { data: modelDetails } = await supabase
            .from('model_details')
            .select('model_id')
            .eq('model_id', data.user?.id)
            .maybeSingle()

          if (modelDetails) {
            effectiveRole = 'model'
            await supabase
              .from('profiles')
              .update({ role: 'model' })
              .eq('id', data.user?.id)
          }
        } catch (checkError) {
          console.error('Error checking model_details for role fix:', checkError)
        }
      }

      const redirectUrl = searchParams.get('redirect')

      if (redirectUrl) {
        router.push(redirectUrl)
      } else if (effectiveRole === 'admin') {
        router.push('/dashboard/admin')
      } else if (!profile?.onboarding_completed) {
        router.push('/onboarding')
      } else if (effectiveRole === 'model') {
        router.push('/dashboard/model')
      } else if (effectiveRole === 'company') {
        router.push('/dashboard/company')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (err: any) {
      if (!err.message?.includes('Refresh Token Not Found')) {
        setError(err.message || t('errorFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {verifiedMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-2 rounded-r-lg">
          <p className="text-xs text-green-700 font-medium">{t('verifiedSuccess')}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-2 rounded-r-lg">
          <p className="text-xs text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="text-center mb-3">
        <h2 className="text-lg font-bold text-gray-900">{t('title')}</h2>
      </div>

      <div>
        <label htmlFor="login-email" className="block text-xs font-bold text-gray-700 mb-1">
          {t('emailLabel')}<span className="text-pink-600">*</span>
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t('emailPlaceholder')}
          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-xs font-bold text-gray-700 mb-1">
          {t('passwordLabel')}<span className="text-pink-600">*</span>
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t('passwordPlaceholder')}
            className="w-full px-3 py-2 pr-10 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="text-right">
        <Link href="/forgot-password" className="text-xs text-pink-600 hover:text-pink-700 font-semibold">
          {t('forgotPassword')}
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 rounded-lg transition-all shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t('submitting')}
          </span>
        ) : (
          t('submit')
        )}
      </button>
    </form>
  )
}

function LoginPageContent() {
  const t = useTranslations('auth.login')
  const tTabs = useTranslations('auth.tabs')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-gray-50 py-4 sm:py-6 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="inline-flex bg-white border border-gray-200 rounded-lg shadow-sm p-1">
              <div className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-white bg-brand rounded-md shadow-sm">
                {tTabs('signIn')}
              </div>
              <Link
                href="/register"
                className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all"
              >
                {tTabs('register')}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-[#1f2126] p-5 sm:p-8 flex flex-col justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">{t('leftHeading')}</h1>
                  <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-8">{t('leftSubtitle')}</p>

                  <div className="space-y-4">
                    {[
                      t('bullet1'),
                      t('bullet2'),
                      t('bullet3'),
                      t('bullet4'),
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-gray-700">
                  <p className="text-xs text-gray-500">
                    {t('noAccount')}{' '}
                    <Link href="/register" className="text-brand hover:text-brand-hover font-semibold transition-colors">
                      {t('registerHere')}
                    </Link>
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" /></div>}>
                  <LoginFormInner />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginPageContent />
}
