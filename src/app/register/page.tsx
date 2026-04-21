import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import RegisterForm from '@/components/auth/RegisterForm'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-gray-50 py-4 px-3 sm:py-6 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="inline-flex bg-white border border-gray-200 rounded-lg shadow-sm p-1">
              <Link
                href="/login"
                className="px-4 py-2 sm:px-6 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all"
              >
                Sign in
              </Link>
              <div className="px-4 py-2 sm:px-6 text-sm font-bold text-white bg-brand rounded-md shadow-sm">
                Register
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Column - dark, like navbar */}
              <div className="bg-[#1f2126] p-5 sm:p-8 flex flex-col justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    Your personal login in one minute.
                  </h1>
                  <p className="text-sm text-gray-400 mb-5 sm:mb-8">Free of charge and discreet.</p>

                  <div className="space-y-3 sm:space-y-4">
                    {[
                      'Absolutely free registration',
                      'Discreet, secure & anonymous',
                      'Access to Advertisement Manager',
                      'Reach 1.5 million monthly searches',
                      'Swiss company quality standards',
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
                    Already have an account?{' '}
                    <Link href="/login" className="text-brand hover:text-brand-hover font-semibold transition-colors">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>

              {/* Right Column - Registration Form */}
              <div className="p-5 sm:p-8">
                <Suspense fallback={<div className="flex items-center justify-center p-6 sm:p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div></div>}>
                  <RegisterForm />
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
