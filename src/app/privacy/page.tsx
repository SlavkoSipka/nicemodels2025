import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'

export default function PrivacyPage() {
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
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Privacy Policy
              </h1>
              <p className="text-sm text-gray-600">Last updated: January 2026</p>
            </div>

            {/* Content */}
            <div className="prose prose-purple max-w-none">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 mb-2">Page Under Construction</h3>
                    <p className="text-sm text-blue-700 mb-0">
                      This page is currently being developed. We are working on finalizing our Privacy Policy to ensure 
                      full transparency about how we collect, use, and protect your personal data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 text-gray-700">
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon</h2>
                  <p>
                    We are committed to protecting your privacy. Our comprehensive Privacy Policy will cover:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>What personal information we collect</li>
                    <li>How we use your information</li>
                    <li>Data storage and security measures</li>
                    <li>Cookie usage and tracking</li>
                    <li>Third-party service providers</li>
                    <li>Your rights regarding your personal data (GDPR compliance)</li>
                    <li>Data retention policies</li>
                    <li>How to request data deletion or modification</li>
                  </ul>
                </section>

                <section className="border-t border-gray-200 pt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Privacy Matters</h2>
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 p-5 rounded-lg border border-green-200">
                    <p className="mb-2">
                      <strong className="text-green-800">We are committed to:</strong>
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Protecting your personal information</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Being transparent about data usage</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Complying with GDPR and Swiss data protection laws</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Giving you control over your data</span>
                      </li>
                    </ul>
                  </div>
                </section>

                <section className="border-t border-gray-200 pt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact Us</h2>
                  <p>
                    If you have any questions or concerns about your privacy, please contact our Data Protection Officer at:
                  </p>
                  <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-purple-600">privacy@nicemodels.ch</p>
                  </div>
                </section>

                <section className="border-t border-gray-200 pt-6">
                  <p className="text-sm text-gray-500 italic">
                    By using our platform, you acknowledge that you have read and understood our Privacy Policy once it is published. 
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

