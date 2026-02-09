import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <div className="mb-4">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-pink-600 font-semibold flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Terms and Conditions
              </h1>
              <p className="text-sm text-gray-600">Last updated: January 2026</p>
            </div>

            {/* Content */}
            <div className="prose prose-pink max-w-none">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Page Under Construction</h3>
                    <p className="text-sm text-yellow-700 mb-0">
                      This page is currently being developed. Our legal team is working on finalizing the Terms and Conditions. 
                      Please check back soon for the complete information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 text-gray-700">
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon</h2>
                  <p>
                    We are currently preparing comprehensive Terms and Conditions that will cover:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>User registration and account management</li>
                    <li>Service usage guidelines</li>
                    <li>Payment terms and refund policies</li>
                    <li>Content ownership and intellectual property rights</li>
                    <li>Prohibited activities and user conduct</li>
                    <li>Limitation of liability</li>
                    <li>Dispute resolution procedures</li>
                    <li>Termination and suspension policies</li>
                  </ul>
                </section>

                <section className="border-t border-gray-200 pt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact Us</h2>
                  <p>
                    If you have any questions about our Terms and Conditions, please contact us at:
                  </p>
                  <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-pink-600">support@nicemodels.ch</p>
                  </div>
                </section>

                <section className="border-t border-gray-200 pt-6">
                  <p className="text-sm text-gray-500 italic">
                    By using our platform, you agree to comply with these Terms and Conditions once they are published. 
                    We will notify all registered users when the final version is available.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

