import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { buildMetadata } from '@/lib/seo'
import { ShieldCheck, Wallet, LayoutDashboard, TrendingUp, IdCard, Camera, Video, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = buildMetadata({
  path: '/werden-model',
  title: 'Als Escort Model inserieren – kostenlos & geprüft',
  description: 'Erstelle dein kostenloses Escort-Inserat auf NiceModels.ch. Transparente Verifizierung, eigenes Dashboard mit Statistiken und faire Sichtbarkeit für alle Models in der Schweiz.',
})

const faqs = [
  {
    q: 'Kostet die Registrierung auf NiceModels.ch etwas?',
    a: 'Nein. Ein Inserat auf NiceModels.ch zu erstellen und zu verwalten ist komplett kostenlos. Für zusätzliche Sichtbarkeit (Banner-Werbung) gibt es optionale, kostenpflichtige Zusatzoptionen im Dashboard – diese sind aber nie Voraussetzung für ein normales Inserat.',
  },
  {
    q: 'Wie läuft die Verifizierung ab?',
    a: 'Nach der Registrierung lädst du ein Ausweisdokument und ein Selfie mit dem Ausweis hoch (optional zusätzlich ein kurzes Video). Unser Team prüft die Unterlagen manuell und schaltet dein Profil danach frei. Deine Ausweisdaten werden nicht veröffentlicht – sie dienen ausschliesslich der internen Prüfung.',
  },
  {
    q: 'Wie lange dauert die Freischaltung?',
    a: 'Die manuelle Prüfung erfolgt in der Regel innerhalb weniger Stunden. Solange dein Profil geprüft wird, ist es für Besucher noch nicht sichtbar.',
  },
  {
    q: 'Was sehe ich in meinem Dashboard?',
    a: 'Nach der Freischaltung verwaltest du dein Profil (Fotos, Beschreibung, Preise, Verfügbarkeit) selbst und siehst, wie oft dein Profil angesehen wurde – ohne dass du dafür bezahlen musst.',
  },
  {
    q: 'Kann ich mein Profil jederzeit bearbeiten oder deaktivieren?',
    a: 'Ja. Du entscheidest jederzeit selbst, welche Informationen du teilst, und kannst dein Profil im Dashboard bearbeiten oder pausieren.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

export default function WerdenModelPage() {
  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="mx-auto max-w-[900px] px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand bg-brand/10 rounded-full px-3 py-1 mb-4">
            Für Models & Begleiterinnen
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            Als Escort Model inserieren – kostenlos, fair und geprüft
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            NiceModels.ch ist das Schweizer Erotikportal, auf dem du dein Profil kostenlos veröffentlichst.
            Jedes Profil wird vor der Freischaltung persönlich geprüft – für mehr Sicherheit für dich und deine Kontakte.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3 bg-brand hover:bg-brand-hover text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
            >
              Jetzt kostenlos registrieren
            </Link>
            <Link
              href="/blog"
              className="w-full sm:w-auto px-8 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Tipps für dein Inserat lesen
            </Link>
          </div>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {[
            { icon: Wallet, title: 'Komplett kostenlos', text: 'Kein Abo, keine versteckten Gebühren für dein Inserat. Zusätzliche Sichtbarkeit über Banner ist optional.' },
            { icon: ShieldCheck, title: 'Geprüfte Profile', text: 'Jedes Profil wird manuell von unserem Team verifiziert, bevor es öffentlich sichtbar wird.' },
            { icon: LayoutDashboard, title: 'Eigenes Dashboard', text: 'Verwalte Fotos, Beschreibung, Preise und Verfügbarkeit selbst – jederzeit anpassbar.' },
            { icon: TrendingUp, title: 'Echte Statistiken', text: 'Sieh transparent, wie oft dein Profil angesehen wurde, ganz ohne Zusatzkosten.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-gray-200 bg-white p-5">
              <Icon className="w-6 h-6 text-brand mb-2" />
              <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* Verification process */}
        <div className="mb-12">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">So läuft die Verifizierung ab</h2>
          <p className="text-sm text-gray-500 mb-5">Drei Schritte, bevor dein Profil live geht.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: IdCard, step: '1', title: 'Ausweisdokument', text: 'Lade ein gültiges Ausweisdokument hoch, um dein Alter und deine Identität zu bestätigen.' },
              { icon: Camera, step: '2', title: 'Selfie mit Ausweis', text: 'Ein aktuelles Selfie zusammen mit deinem Ausweis bestätigt, dass das Profil wirklich dir gehört.' },
              { icon: Video, step: '3', title: 'Video (optional)', text: 'Ein kurzes Video kann die Prüfung zusätzlich beschleunigen, ist aber nicht zwingend erforderlich.' },
            ].map(({ icon: Icon, step, title, text }) => (
              <div key={step} className="relative rounded-xl border border-gray-200 bg-white p-5">
                <span className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                  {step}
                </span>
                <Icon className="w-6 h-6 text-gray-400 mb-2" />
                <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500 flex items-start gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            Deine Ausweisdaten werden ausschliesslich intern zur Prüfung verwendet und nicht auf deinem öffentlichen Profil angezeigt.
          </p>
        </div>

        {/* FAQ */}
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Häufige Fragen</h2>
          <div className="space-y-3">
            {faqs.map(f => (
              <details key={f.q} className="group rounded-xl border border-gray-200 bg-white p-4">
                <summary className="cursor-pointer list-none font-semibold text-sm text-gray-900 flex items-center justify-between">
                  {f.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-xl bg-brand/5 border border-brand/20 p-6 text-center">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Bereit für dein Inserat?</h2>
          <p className="text-sm text-gray-600 mb-4">Die Registrierung dauert nur wenige Minuten – dein Profil geht nach der Prüfung live.</p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-brand hover:bg-brand-hover text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
          >
            Jetzt kostenlos registrieren
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
