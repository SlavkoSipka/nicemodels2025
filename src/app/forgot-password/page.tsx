'use client'

import { useTranslations } from 'next-intl'
import Navbar from '@/components/layout/Navbar'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50 py-4 px-3 sm:py-8 sm:px-4">
        <div className="max-w-md mx-auto">
          {/* Back to Login */}
          <div className="mb-3 sm:mb-4">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-pink-600 font-semibold flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              {t('backToLogin')}
            </Link>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8">
            <div className="text-center mb-5 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {t('title')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('subtitle')}
              </p>
            </div>

            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </>
  )
}
