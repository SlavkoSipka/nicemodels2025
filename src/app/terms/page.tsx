import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import NicemodelsAgbDe from '@/components/legal/NicemodelsAgbDe'
import ForceGermanProvider from '@/components/legal/ForceGermanProvider'

export const metadata = {
  title: 'AGB | nicemodels.ch',
  description: 'Allgemeine Geschäftsbedingungen (AGB) für nicemodels.ch',
}

export default function TermsPage() {
  return (
    <ForceGermanProvider>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-pink-600 font-semibold flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Zurück zur Startseite
            </Link>
          </div>

          <article className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-gray-100">
            <header className="text-center mb-10 pb-6 border-b border-gray-100">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Allgemeine Geschäftsbedingungen (AGB)
              </h1>
              <p className="text-sm text-gray-600">Stand: 20. April 2026</p>
            </header>

            <NicemodelsAgbDe />

            <p className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
              Fragen? Kontaktieren Sie uns über das{' '}
              <Link href="/contact" className="text-pink-600 hover:underline font-medium">
                Kontaktformular
              </Link>
              .
            </p>
          </article>
        </div>
      </div>
      <Footer />
    </ForceGermanProvider>
  )
}
