import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react'
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

const SLUG = 'profil-erstellen'
const topic = helpTopic(SLUG)!

export const metadata: Metadata = buildMetadata({
  path: helpUrl(SLUG),
  title: 'Profil erstellen – Schritt-für-Schritt-Anleitung',
  description: topic.description,
  ogType: 'article',
})

const steps: HelpStep[] = [
  {
    title: 'Konto registrieren',
    body:
      'Wähle auf der Registrierungsseite die Rolle Model und leg dein Konto mit E-Mail-Adresse und Passwort an. Die Registrierung selbst ist kostenlos und dauert nur wenige Minuten.',
    href: '/register',
    hrefLabel: 'Zur Registrierung',
  },
  {
    title: 'E-Mail-Adresse bestätigen',
    body:
      'Wir schicken dir einen Bestätigungslink. Erst danach kannst du dich anmelden und dein Dashboard öffnen. Schau notfalls im Spam-Ordner nach, falls die Mail nicht ankommt.',
  },
  {
    title: 'Verifizierung einreichen',
    body:
      'Lade im Dashboard unter Verifizierung ein gut lesbares Foto deines Personalausweises oder Reisepasses hoch, dazu ein Selfie, auf dem du das Dokument neben dein Gesicht hältst. Ein kurzes Video ist optional und kann die Prüfung beschleunigen. Unser Team prüft die Unterlagen manuell, in der Regel innerhalb von 24 bis 48 Stunden.',
    href: '/dashboard/model/verification',
    hrefLabel: 'Verifizierung öffnen',
  },
  {
    title: 'Profilangaben ausfüllen',
    body:
      'Unter Profil findest du die einzelnen Bereiche: Über mich, Biografie, Gebiet, Sprachen, Services, Preise, Arbeitszeiten und Kontaktdaten. Du kannst jeden Bereich einzeln speichern und später jederzeit anpassen – du musst nicht alles auf einmal erledigen.',
    href: '/dashboard/model/profile/about-me',
    hrefLabel: 'Profil bearbeiten',
  },
  {
    title: 'Fotos und Videos hochladen',
    body:
      'Im Bereich Bilder & Video lädst du deine Medien hoch – pro Datei maximal 10 MB. Die Reihenfolge bestimmst du selbst; das erste Bild ist dein Titelbild und entscheidet massgeblich darüber, ob jemand deine Karte anklickt.',
    href: '/dashboard/model/profile/pictures-video',
    hrefLabel: 'Medien verwalten',
  },
  {
    title: 'Sedcard aktivieren',
    body:
      'Ein ausgefülltes Profil ist noch nicht öffentlich sichtbar. Erst wenn du deine Sedcard aktivierst, erscheint sie in der Liste und in der Suche. Wie das geht, steht in der Sedcard-Anleitung.',
    href: helpUrl('sedcard'),
    hrefLabel: 'Zur Sedcard-Anleitung',
  },
]

const completeness = [
  'Ein scharfes, aktuelles Titelbild – es entscheidet über den ersten Klick.',
  'Mehrere Fotos statt nur einem: Profile mit einer Bildergalerie werden deutlich länger angesehen.',
  'Eine persönlich geschriebene Beschreibung statt kopierter Standardtexte.',
  'Stadt und Einsatzgebiet, damit du in den regionalen Filtern überhaupt auftauchst.',
  'Sprachen, Services und Preise – das sind die Angaben, nach denen am häufigsten gefiltert wird.',
  'Arbeitszeiten und Kontaktweg, damit Anfragen zur richtigen Zeit über den richtigen Kanal kommen.',
]

const faqs: HelpFaq[] = [
  {
    q: 'Kostet das Erstellen eines Profils etwas?',
    a: 'Nein. Registrierung, Profil und Verwaltung sind kostenlos. Kostenpflichtig sind nur optionale Zusatzoptionen für mehr Sichtbarkeit, etwa Banner-Werbeplätze – die sind aber nie Voraussetzung für ein normales Inserat.',
  },
  {
    q: 'Wie lange dauert die Prüfung meiner Verifizierung?',
    a: 'Die Unterlagen werden manuell geprüft, üblicherweise innerhalb von 24 bis 48 Stunden. Solange die Prüfung läuft, ist dein Profil für Besucher noch nicht sichtbar.',
  },
  {
    q: 'Werden meine Ausweisdaten veröffentlicht?',
    a: 'Nein. Ausweisdokument und Selfie dienen ausschliesslich der internen Altersprüfung und Identitätsbestätigung. Sie erscheinen nirgends auf deinem öffentlichen Profil.',
  },
  {
    q: 'Muss ich das Profil in einem Zug fertig ausfüllen?',
    a: 'Nein. Jeder Profilbereich wird einzeln gespeichert. Du kannst jederzeit zurückkehren, ergänzen und ändern – auch nachdem deine Sedcard bereits aktiv ist.',
  },
  {
    q: 'Kann ich mein Profil später wieder verbergen?',
    a: 'Ja. Im Dashboard gibt es einen Schalter für die Sichtbarkeit deiner Sedcard. Schaltest du ihn aus, verschwindet dein Profil aus der Liste, bleibt dir aber mit allen Inhalten erhalten.',
  },
]

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: topic.title,
  description: topic.description,
  totalTime: 'PT15M',
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

export default function HelpProfilErstellenPage() {
  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleJsonLd, faqJsonLd, breadcrumbJsonLd]),
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

        <section className="mb-12">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">In sechs Schritten online</h2>
          <p className="mb-5 text-sm text-gray-500">
            Von der Registrierung bis zur sichtbaren Sedcard.
          </p>
          <HelpSteps steps={steps} />
        </section>

        <section className="mb-12">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">
            Was ein vollständiges Profil ausmacht
          </h2>
          <p className="mb-5 text-sm text-gray-500">
            Diese Angaben entscheiden darüber, wie oft dein Profil gefunden und geöffnet wird.
          </p>
          <ul className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-5">
            {completeness.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            Du entscheidest bei jedem Feld selbst, was du teilst. Angaben, die du leer lässt,
            erscheinen auch nicht auf deinem öffentlichen Profil.
          </p>
        </section>

        <section>
          <h2 className="mb-5 text-lg font-bold text-gray-900 sm:text-xl">Häufige Fragen</h2>
          <HelpFaqList faqs={faqs} />
        </section>

        <HelpCta
          title="Bereit für dein Profil?"
          text="Die Registrierung dauert nur wenige Minuten – nach der Prüfung geht dein Profil live."
          href="/register"
          label="Jetzt kostenlos registrieren"
        />

        <HelpRelated currentSlug={SLUG} />
      </main>

      <Footer />
    </>
  )
}
