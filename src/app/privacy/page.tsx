import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Datenschutz | nicemodels.ch',
  description: 'Datenschutzerklärung und Hinweise zum Datenschutz bei nicemodels.ch',
}

export default function PrivacyPage() {
  return (
    <>
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
            <header className="text-center mb-8 pb-6 border-b border-gray-100">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Datenschutz / Privacy Policy
              </h1>
              <p className="text-sm text-gray-600">Stand: 18. März 2026</p>
            </header>

            <div className="prose prose-slate max-w-none text-gray-700 space-y-4">
              <p className="text-base leading-relaxed">
                Die <strong>Datenschutzerklärung</strong> und die weiteren rechtlichen Regelungen zu Ihren Daten, Cookies, Newslettern und Ihren Rechten sind in den{' '}
                <strong>Allgemeinen Geschäftsbedingungen (AGB)</strong> von nicemodels.ch geregelt – insbesondere in{' '}
                <strong>Abschnitt 1 (Datenschutzerklärung)</strong>.
              </p>
              <p className="text-base leading-relaxed">
                Bitte lesen Sie dort den vollständigen Text. Die AGB gelten für die Nutzung von www.nicemodels.ch und regeln neben dem Datenschutz auch Leistungen, Nutzung, Inserate, Haftung und Schlussbestimmungen.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <Link
                  href="/terms#datenschutzerklaerung"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 transition-colors"
                >
                  Zu Abschnitt 1 – Datenschutzerklärung (AGB)
                </Link>
                <Link
                  href="/terms"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 text-gray-800 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Alle AGB anzeigen
                </Link>
              </div>
              <p className="text-sm text-gray-500 pt-4">
                Kontakt für Datenschutzanfragen: über das{' '}
                <Link href="/contact" className="text-pink-600 hover:underline font-medium">
                  Kontaktformular
                </Link>
                {' '}oder die auf der Kontaktseite angegebenen Kanäle.
              </p>
            </div>
          </article>
        </div>
      </div>
      <Footer />
    </>
  )
}
