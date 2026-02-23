import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import LoginForm from '@/components/auth/LoginForm'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-gray-50 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-white border border-gray-200 rounded-lg shadow-sm p-1">
              <div className="px-6 py-2 text-sm font-bold text-white bg-brand rounded-md shadow-sm">
                Sign in
              </div>
              <Link
                href="/register"
                className="px-6 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-all"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Column - dark, like navbar top bar */}
              <div className="bg-[#1f2126] p-8 flex flex-col justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">Welcome back!</h1>
                  <p className="text-sm text-gray-400 mb-8">Sign in to your account</p>

                  <div className="space-y-4">
                    {[
                      'Access your personal dashboard',
                      'Manage your advertisements',
                      'View statistics & analytics',
                      'Save your favorite profiles',
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

                <div className="mt-10 pt-6 border-t border-gray-700">
                  <p className="text-xs text-gray-500">Don't have an account?{' '}
                    <Link href="/register" className="text-brand hover:text-brand-hover font-semibold transition-colors">
                      Register here
                    </Link>
                  </p>
                </div>
              </div>

              {/* Right Column - Login Form */}
              <div className="p-8">
                <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div></div>}>
                  <LoginForm />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
