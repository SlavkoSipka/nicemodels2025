import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Clock, LifeBuoy, Mail, MessageCircle } from 'lucide-react'
import { buildMetadata, buildBreadcrumbJsonLd } from '@/lib/seo'
import { HELP_PATH, HELP_TOPICS, helpUrl } from '@/lib/helpTopics'
import { HELP_ICONS } from '@/components/help/HelpArticle'

export const metadata: Metadata = buildMetadata({
  path: HELP_PATH,
  title: 'Help Point – Anleitungen für dein Profil und deine Sedcard',
  description:
    'Der Help Point von NiceModels.ch: Schritt-für-Schritt-Anleitungen zum Erstellen deines Profils, zur Verifizierung und zur Sedcard – plus direkter Draht zum Support.',
})

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: 'Startseite', path: '/' },
  { name: 'Hilfe', path: HELP_PATH },
])

export default function HelpIndexPage() {
  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="mx-auto max-w-[900px] px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
            <LifeBuoy className="h-3.5 w-3.5" />
            Help Point
          </span>
          <h1 className="mb-4 text-2xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
            Hilfe und Anleitungen
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Alles, was du brauchst, um auf NiceModels.ch loszulegen – von der Registrierung bis zur
            fertigen Sedcard. Jede Anleitung führt dich Schritt für Schritt durch die Oberfläche,
            die du im Dashboard wirklich vor dir hast.
          </p>
        </div>

        {/* Guides */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {HELP_TOPICS.map(topic => {
            const Icon = HELP_ICONS[topic.icon]
            return (
              <Link
                key={topic.slug}
                href={helpUrl(topic.slug)}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-brand/40 hover:shadow-sm"
              >
                <Icon className="mb-3 h-7 w-7 text-brand" />
                <h2 className="mb-1.5 text-base font-bold text-gray-900 transition-colors group-hover:text-brand">
                  {topic.title}
                </h2>
                <p className="mb-3 flex-1 text-sm leading-relaxed text-gray-600">
                  {topic.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  ca. {topic.minutes} Min. Lesezeit
                </span>
              </Link>
            )
          })}
        </div>

        {/* Support */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">
            Deine Frage ist nicht dabei?
          </h2>
          <p className="mb-5 text-sm text-gray-600">
            Schreib uns – wir antworten in der Regel innerhalb weniger Stunden.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href="https://wa.me/41783339396"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366]">
                <MessageCircle className="h-4 w-4 text-white" />
              </span>
              <span>
                <span className="block text-sm font-bold text-gray-900">WhatsApp</span>
                <span className="block text-xs text-gray-500">Schnellste Antwort</span>
              </span>
            </a>
            <Link
              href="/contact"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-dark to-brand">
                <Mail className="h-4 w-4 text-white" />
              </span>
              <span>
                <span className="block text-sm font-bold text-gray-900">Kontaktformular</span>
                <span className="block text-xs text-gray-500">Für ausführliche Anliegen</span>
              </span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
