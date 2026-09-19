import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CheckCircle2, Clock, Eye, Megaphone } from 'lucide-react'
import { buildMetadata, buildBreadcrumbJsonLd } from '@/lib/seo'
import { HELP_PATH, helpTopic, helpUrl } from '@/lib/helpTopics'
import {
  HelpBreadcrumb,
  HelpCta,
  HelpFaqList,
  HelpRelated,
  HelpSteps,
  type HelpFaq,
  type HelpStep,
} from '@/components/help/HelpArticle'

const SLUG = 'sedcard'
const topic = helpTopic(SLUG)!

export const metadata: Metadata = buildMetadata({
  path: helpUrl(SLUG),
  title: 'Sedcard aktivieren – so wird dein Profil sichtbar',
  description: topic.description,
  ogType: 'article',
})

const steps: HelpStep[] = [
  {
    title: 'Profil zuerst fertigstellen',
    body:
      'Bevor du aktivierst, sollten Fotos, Beschreibung, Gebiet, Services und Preise stehen. Eine Sedcard, die mit halb leeren Feldern live geht, kostet dich genau die Aufmerksamkeit, für die du sie aktiviert hast.',
    href: helpUrl('profil-erstellen'),
    hrefLabel: 'Anleitung: Profil erstellen',
  },
  {
    title: 'Im Dashboard auf Sedcard aktivieren gehen',
    body:
      'Öffne dein Model-Dashboard und wähle Sedcard aktivieren. Dort siehst du die verfügbaren Laufzeiten und, falls bereits eine Sedcard läuft, wann sie abläuft.',
    href: '/dashboard/model/activate-ad',
    hrefLabel: 'Sedcard aktivieren',
  },
  {
    title: 'Laufzeit wählen und bestätigen',
    body:
      'Such dir eine Laufzeit aus und bestätige die Aktivierung. Während der laufenden Aktion ist die Aktivierung kostenlos – der Bestätigungsschritt bleibt derselbe, es fällt nur kein Betrag an.',
  },
  {
    title: 'Sichtbarkeit prüfen',
    body:
      'Nach der Aktivierung erscheint deine Sedcard in der Model-Liste, in der Suche und in den regionalen Filtern. Im Dashboard siehst du ausserdem, wie oft dein Profil angesehen wurde.',
    href: '/dashboard/model/statistics',
    hrefLabel: 'Statistiken ansehen',
  },
]

const quality = [
  'Titelbild scharf, gut ausgeleuchtet und aktuell – es ist das Einzige, was in der Liste zu sehen ist.',
  'Mehrere Fotos in sinnvoller Reihenfolge; das stärkste Bild gehört nach vorn.',
  'Kurze, selbst geschriebene Beschreibung – Standardtexte lesen sich schnell wie ein Massenprofil.',
  'Preise und Services vollständig, damit Anfragen von Anfang an zu dir passen.',
  'Arbeitszeiten aktuell halten, damit Anfragen dann kommen, wenn du erreichbar bist.',
  'Stadt und Einsatzgebiet korrekt setzen – ohne sie fällst du aus den regionalen Filtern.',
]

const faqs: HelpFaq[] = [
  {
    q: 'Was ist eine Sedcard überhaupt?',
    a: 'Die Sedcard ist dein öffentliches Inserat: die Karte, die Besucher in der Model-Liste und in der Suche sehen, mit deinen Fotos, deiner Beschreibung und deinen Angaben. Dein Profil im Dashboard kannst du jederzeit pflegen – öffentlich sichtbar wird es erst über eine aktive Sedcard.',
  },
  {
    q: 'Was kostet die Aktivierung?',
    a: 'Während der laufenden Aktion ist die Aktivierung der Sedcard kostenlos. Der Ablauf im Dashboard bleibt gleich; bei den Paketen wird dann kein Preis, sondern der Aktionshinweis angezeigt.',
  },
  {
    q: 'Was passiert, wenn meine Sedcard abläuft?',
    a: 'Sie verschwindet aus der öffentlichen Liste, dein Profil samt Fotos und Angaben bleibt aber vollständig erhalten. Du kannst jederzeit neu aktivieren, ohne etwas erneut auszufüllen.',
  },
  {
    q: 'Kann ich meine Sedcard vorübergehend verbergen?',
    a: 'Ja. Im Dashboard gibt es einen Schalter für die Sichtbarkeit. Schaltest du ihn aus, ist deine Sedcard nirgends öffentlich erreichbar – auch nicht im Chat-Bereich – und du kannst sie jederzeit wieder einschalten.',
  },
  {
    q: 'Wie werde ich zusätzlich sichtbarer?',
    a: 'Neben der Sedcard kannst du Werbeplätze buchen: ein breites Banner im Feed, einen Kartenplatz im Raster oder eine der beiden vertikalen Spalten links und rechts neben der Liste. Diese Plätze sind optional und unabhängig von deiner Sedcard.',
  },
]

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: topic.title,
  description: topic.description,
  totalTime: 'PT10M',
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

export default function HelpSedcardPage() {
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

        <header className="mb-10">
          <h1 className="mb-4 text-2xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
            {topic.title}
          </h1>
          <p className="mb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
            {topic.description}
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            ca. {topic.minutes} Min. Lesezeit
          </span>
        </header>

        {/* What it is */}
        <section className="mb-12">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <Eye className="mb-2 h-6 w-6 text-brand" />
            <h2 className="mb-1.5 text-base font-bold text-gray-900">
              Profil und Sedcard sind nicht dasselbe
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              Dein <strong>Profil</strong> ist der Bereich im Dashboard, in dem du Fotos, Texte,
              Services und Preise pflegst – er gehört dir und bleibt dauerhaft bestehen. Deine{' '}
              <strong>Sedcard</strong> ist die öffentliche Anzeige dieses Profils in der Liste und
              in der Suche. Sie läuft für eine gewählte Dauer und kann jederzeit neu aktiviert
              werden, ohne dass du Inhalte erneut eingibst.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">So aktivierst du sie</h2>
          <p className="mb-5 text-sm text-gray-500">Vier Schritte im Dashboard.</p>
          <HelpSteps steps={steps} />
        </section>

        <section className="mb-12">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">
            Was eine gute Sedcard ausmacht
          </h2>
          <p className="mb-5 text-sm text-gray-500">
            Die Aktivierung bringt dich in die Liste – der Rest entscheidet über die Klicks.
          </p>
          <ul className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-5">
            {quality.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Visibility add-ons */}
        <section className="mb-12">
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-5">
            <Megaphone className="mb-2 h-6 w-6 text-violet-600" />
            <h2 className="mb-1.5 text-base font-bold text-gray-900">
              Optional: zusätzliche Werbeplätze
            </h2>
            <p className="mb-3 text-sm leading-relaxed text-gray-600">
              Wenn du über die Sedcard hinaus auffallen möchtest, kannst du im Dashboard
              Werbeplätze buchen: ein breites Banner im Feed, einen Kartenplatz im Raster oder eine
              der beiden vertikalen Spalten links und rechts neben der Liste. Auf dem Smartphone
              erscheinen die Spalten als Promo-Streifen am unteren Rand. Du wählst dabei auch, in
              welchen Kantonen dein Banner ausgespielt wird.
            </p>
            <p className="text-xs text-gray-500">
              Werbeplätze sind freiwillig und völlig unabhängig davon, ob deine Sedcard sichtbar
              ist – ein normales Inserat funktioniert auch ganz ohne sie.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-lg font-bold text-gray-900 sm:text-xl">Häufige Fragen</h2>
          <HelpFaqList faqs={faqs} />
        </section>

        <HelpCta
          title="Sedcard aktivieren"
          text="Profil fertig? Dann bring es in die Liste – während der Aktion kostenlos."
          href="/dashboard/model/activate-ad"
          label="Zum Dashboard"
        />

        <HelpRelated currentSlug={SLUG} />
      </main>

      <Footer />
    </>
  )
}
