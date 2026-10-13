import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Clock, PlayCircle } from 'lucide-react'
import { buildMetadata, buildBreadcrumbJsonLd } from '@/lib/seo'
import { HELP_PATH, helpTopic, helpUrl } from '@/lib/helpTopics'
import SignupDemo from '@/components/help/SignupDemo'
import {
  HelpBreadcrumb,
  HelpCta,
  HelpFaqList,
  HelpRelated,
  HelpSteps,
  type HelpFaq,
  type HelpStep,
} from '@/components/help/HelpArticle'

const SLUG = 'konto-erstellen'
const topic = helpTopic(SLUG)!

export const metadata: Metadata = buildMetadata({
  path: helpUrl(SLUG),
  title: 'Konto erstellen – animierte Anleitung zur Registrierung',
  description: topic.description,
  ogType: 'article',
})

// The written version of what the animation shows, for readers who prefer
// text and for search engines (the animation itself is aria-hidden).
const steps: HelpStep[] = [
  {
    title: 'Registrierung öffnen',
    body: 'Klicke oben rechts auf «Registrieren». Auf dem Handy öffnest du zuerst das Menü ☰ und tippst dort auf «Registrieren». Die Registrierung ist komplett kostenlos.',
    href: '/register',
    hrefLabel: 'Zur Registrierung',
  },
  {
    title: 'Benutzertyp wählen',
    body: 'Wähle zwischen Mitglied / Besucher, Unabhängiges Model und Agentur / Club. Für ein eigenes Profil wählst du «Unabhängiges Model», für einen Betrieb «Agentur / Club».',
  },
  {
    title: 'Benutzername, E-Mail und Telefonnummer eingeben',
    body: 'Alle drei Felder sind Pflicht. Mit der E-Mail-Adresse und deinem Passwort meldest du dich später an. Bei der Telefonnummer ist die Schweizer Vorwahl +41 bereits ausgewählt.',
  },
  {
    title: 'Geburtsdatum angeben (freiwillig)',
    body: 'Das Geburtsdatum ist optional. Wenn du es angibst, musst du mindestens 18 Jahre alt sein.',
  },
  {
    title: 'Passwort festlegen und bestätigen',
    body: 'Das Passwort braucht mindestens 6 Zeichen und muss in beiden Feldern genau gleich sein.',
  },
  {
    title: 'AGB und Datenschutz akzeptieren',
    body: 'Setze die beiden Pflicht-Häkchen. Der Newsletter ist freiwillig.',
  },
  {
    title: 'Auf «Registrieren» klicken',
    body: 'Dein Konto wird sofort erstellt und du bist direkt eingeloggt. Models und Clubs geht es danach im Onboarding weiter, Mitglieder landen direkt im Dashboard.',
    href: helpUrl('profil-erstellen'),
    hrefLabel: 'Weiter: Profil erstellen',
  },
]

const faqs: HelpFaq[] = [
  {
    q: 'Kostet die Registrierung etwas?',
    a: 'Nein. Das Konto zu erstellen ist kostenlos. Kostenpflichtig sind nur optionale Zusatzleistungen für mehr Sichtbarkeit.',
  },
  {
    q: 'Welchen Benutzertyp soll ich wählen?',
    a: '«Unabhängiges Model», wenn du ein eigenes Profil mit Sedcard veröffentlichen möchtest. «Agentur / Club», wenn du einen Betrieb vertrittst. «Mitglied / Besucher», wenn du die Seite als Gast nutzen möchtest.',
  },
  {
    q: 'Was passiert direkt nach der Registrierung?',
    a: 'Du bist sofort eingeloggt. Als Model oder Club führt dich das Onboarding durch die ersten Angaben; danach reichst du die Verifizierung ein und richtest dein Profil ein.',
  },
  {
    q: 'Die Seite meldet, dass meine E-Mail schon registriert ist – was nun?',
    a: 'Dann besteht bereits ein Konto mit dieser Adresse. Melde dich an, oder setze über «Passwort vergessen» ein neues Passwort, falls du es nicht mehr weisst.',
  },
  {
    q: 'Ich komme nicht weiter – wer hilft mir?',
    a: 'Schreib uns über das Kontaktformular oder per WhatsApp. Wir helfen dir gerne bei der Registrierung.',
  },
]

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: topic.title,
  description: topic.description,
  totalTime: 'PT2M',
  step: steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.body,
  })),
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: 'Startseite', path: '/' },
  { name: 'Hilfe', path: HELP_PATH },
  { name: topic.short, path: helpUrl(SLUG) },
])

export default function HelpKontoErstellenPage() {
  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([howToJsonLd, faqJsonLd, breadcrumbJsonLd]),
        }}
      />

      <main className="mx-auto max-w-[900px] px-4 py-8 sm:py-12">
        <HelpBreadcrumb current={topic.short} />

        <header className="mb-8">
          <h1 className="mb-4 text-2xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
            {topic.title}
          </h1>
          <p className="mb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
            {topic.description}
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            ca. {topic.minutes} Min.
          </span>
        </header>

        <section className="mb-12">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl">
            <PlayCircle className="h-5 w-5 text-brand" />
            So sieht die Registrierung aus
          </h2>
          <p className="mb-5 text-sm text-gray-500">
            Die Anleitung spielt automatisch ab – wahlweise am Laptop oder am Handy. Mit «Zurück»
            und «Weiter» oder über die Leiste springst du zu jedem Schritt.
          </p>
          <div className="xl:-mx-16">
            <SignupDemo />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">Alle Schritte zum Nachlesen</h2>
          <p className="mb-5 text-sm text-gray-500">In rund zwei Minuten zum eigenen Konto.</p>
          <HelpSteps steps={steps} />
        </section>

        <section>
          <h2 className="mb-5 text-lg font-bold text-gray-900 sm:text-xl">Häufige Fragen</h2>
          <HelpFaqList faqs={faqs} />
        </section>

        <HelpCta
          title="Bereit?"
          text="Die Registrierung ist kostenlos und dauert nur ein paar Minuten."
          href="/register"
          label="Jetzt kostenlos registrieren"
        />

        <HelpRelated currentSlug={SLUG} />
      </main>

      <Footer />
    </>
  )
}
