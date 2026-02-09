import Navbar from '@/components/layout/Navbar'
import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex bg-white rounded-lg shadow-md p-1">
              <Link
                href="/login"
                className="px-6 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-all"
              >
                Sign in
              </Link>
              <div className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg shadow-lg">
                Register
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Benefits */}
              <div>
                {/* Header */}
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Your personal login in one minute.
                  </h1>
                  <p className="text-sm text-gray-600">Free of charge and discreet.</p>
                </div>

            {/* Benefits List */}
            <div className="space-y-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">Absolutely free registration</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">Discreet, secure & anonymous</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">Access to Advertisement Manager</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">Reach 1.5 million monthly searches</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">Swiss company quality standards</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Registration Form */}
              <div>
                <RegisterForm />
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-xs text-gray-600 mt-3">
            Already have an account?{' '}
            <Link href="/login" className="text-pink-600 hover:text-pink-700 font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
