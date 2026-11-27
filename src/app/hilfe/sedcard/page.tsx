import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CheckCircle2, Clock, Eye, Megaphone, PlayCircle } from 'lucide-react'
import { buildMetadata, buildBreadcrumbJsonLd } from '@/lib/seo'
import { HELP_PATH, helpTopic, helpUrl } from '@/lib/helpTopics'
import SedcardDemo from '@/components/help/SedcardDemo'
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

// Metadata stays German like the rest of the Help Point: the locale comes from a
// cookie, not the URL, so there is no separate English URL to index.
export const metadata: Metadata = buildMetadata({
  path: helpUrl(SLUG),
  title: 'Sedcard aktivieren – so wird dein Profil sichtbar',
  description: topic.description,
  ogType: 'article',
})

type Lang = 'de' | 'en'

interface PageCopy {
  title: string
  short: string
  description: string
  minutes: string
  demoHeading: string
  demoIntro: string
  notSameTitle: string
  notSame: [string, string, string, string, string]
  stepsHeading: string
  stepsIntro: string
  steps: HelpStep[]
  qualityHeading: string
  qualityIntro: string
  quality: string[]
  addonsTitle: string
  addonsText: string
  addonsNote: string
  faqHeading: string
  faqs: HelpFaq[]
  cta: { title: string; text: string; label: string }
  crumbs: [string, string]
}

const COPY: Record<Lang, PageCopy> = {
  de: {
    title: topic.title,
    short: topic.short,
    description: topic.description,
    minutes: `ca. ${topic.minutes} Min. Lesezeit`,
    demoHeading: 'So sieht die Aktivierung aus',
    demoIntro:
      'Die Anleitung spielt die Aktivierung im Dashboard Schritt für Schritt ab – wahlweise am Laptop oder am Handy. Mit «Zurück» und «Weiter» oder über die Leiste springst du zu jedem Schritt.',
    notSameTitle: 'Profil und Sedcard sind nicht dasselbe',
    notSame: [
      'Dein ',
      'Profil',
      ' ist der Bereich im Dashboard, in dem du Fotos, Texte, Services und Preise pflegst – er gehört dir und bleibt dauerhaft bestehen. Deine ',
      'Sedcard',
      ' ist die öffentliche Anzeige dieses Profils in der Liste und in der Suche. Sie läuft für eine gewählte Dauer und kann jederzeit neu aktiviert werden, ohne dass du Inhalte erneut eingibst.',
    ],
    stepsHeading: 'So aktivierst du sie',
    stepsIntro: 'Vier Schritte im Dashboard.',
    steps: [
      {
        title: 'Profil zuerst fertigstellen',
        body: 'Bevor du aktivierst, sollten Fotos, Beschreibung, Gebiet, Services und Preise stehen. Eine Sedcard, die mit halb leeren Feldern live geht, kostet dich genau die Aufmerksamkeit, für die du sie aktiviert hast.',
        href: helpUrl('profil-erstellen'),
        hrefLabel: 'Anleitung: Profil erstellen',
      },
      {
        title: 'Im Dashboard auf «Sedcard aktivieren» gehen',
        body: 'Öffne dein Model-Dashboard und wähle links den orangen Button «Sedcard aktivieren» (auf dem Handy über das Menü ☰). Dort siehst du die verfügbaren Laufzeiten und, falls bereits eine Sedcard läuft, wann sie abläuft.',
        href: '/dashboard/model/activate-ad',
        hrefLabel: 'Sedcard aktivieren',
      },
      {
        title: 'Laufzeit wählen und bestätigen',
        body: 'Wähle 5, 14 oder 30 Tage und den Start – «Sofort», im Anschluss an die laufende Sedcard oder an einem bestimmten Datum. Leg die Laufzeit in den Warenkorb, akzeptiere die AGB und klicke auf «Jetzt aktivieren». Während der laufenden Aktion ist die Aktivierung kostenlos – es fällt kein Betrag an.',
      },
      {
        title: 'Sichtbarkeit prüfen',
        body: 'Nach der Aktivierung erscheint deine Sedcard in der Model-Liste, in der Suche und in den regionalen Filtern. Im Dashboard siehst du ausserdem, wie oft dein Profil angesehen wurde.',
        href: '/dashboard/model/statistics',
        hrefLabel: 'Statistiken ansehen',
      },
    ],
    qualityHeading: 'Was eine gute Sedcard ausmacht',
    qualityIntro: 'Die Aktivierung bringt dich in die Liste – der Rest entscheidet über die Klicks.',
    quality: [
      'Titelbild scharf, gut ausgeleuchtet und aktuell – es ist das Einzige, was in der Liste zu sehen ist.',
      'Mehrere Fotos in sinnvoller Reihenfolge; das stärkste Bild gehört nach vorn.',
      'Kurze, selbst geschriebene Beschreibung – Standardtexte lesen sich schnell wie ein Massenprofil.',
      'Preise und Services vollständig, damit Anfragen von Anfang an zu dir passen.',
      'Arbeitszeiten aktuell halten, damit Anfragen dann kommen, wenn du erreichbar bist.',
      'Stadt und Einsatzgebiet korrekt setzen – ohne sie fällst du aus den regionalen Filtern.',
    ],
    addonsTitle: 'Optional: zusätzliche Werbeplätze',
    addonsText:
      'Wenn du über die Sedcard hinaus auffallen möchtest, kannst du im Dashboard Werbeplätze buchen: ein breites Banner im Feed, einen Kartenplatz im Raster oder eine der beiden vertikalen Spalten links und rechts neben der Liste. Auf dem Smartphone erscheinen die Spalten als Promo-Streifen am unteren Rand. Du wählst dabei auch, in welchen Kantonen dein Banner ausgespielt wird.',
    addonsNote:
      'Werbeplätze sind freiwillig und völlig unabhängig davon, ob deine Sedcard sichtbar ist – ein normales Inserat funktioniert auch ganz ohne sie.',
    faqHeading: 'Häufige Fragen',
    faqs: [
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
    ],
    cta: {
      title: 'Sedcard aktivieren',
      text: 'Profil fertig? Dann bring es in die Liste – während der Aktion kostenlos.',
      label: 'Zum Dashboard',
    },
    crumbs: ['Startseite', 'Hilfe'],
  },
  en: {
    title: topic.en.title,
    short: topic.en.short,
    description: topic.en.description,
    minutes: `approx. ${topic.minutes} min. read`,
    demoHeading: 'This is what activation looks like',
    demoIntro:
      'The guide plays the activation in the dashboard step by step – on a laptop or on a phone. Use “Back” and “Next” or the bar to jump to any step.',
    notSameTitle: 'Profile and sedcard are not the same thing',
    notSame: [
      'Your ',
      'profile',
      ' is the part of the dashboard where you keep your photos, texts, services and rates – it belongs to you and stays for good. Your ',
      'sedcard',
      ' is the public listing of that profile in the list and in search. It runs for a duration you choose and can be activated again at any time, without entering anything again.',
    ],
    stepsHeading: 'How to activate it',
    stepsIntro: 'Four steps in your dashboard.',
    steps: [
      {
        title: 'Finish your profile first',
        body: 'Before you activate, your photos, description, area, services and rates should be in place. A sedcard that goes live with half-empty fields costs you exactly the attention you activated it for.',
        href: helpUrl('profil-erstellen'),
        hrefLabel: 'Guide: create your profile',
      },
      {
        title: 'Go to “Activate Sedcard” in your dashboard',
        body: 'Open your model dashboard and choose the orange “Activate Sedcard” button on the left (on a phone via the menu ☰). There you see the available durations and, if a sedcard is already running, when it expires.',
        href: '/dashboard/model/activate-ad',
        hrefLabel: 'Activate sedcard',
      },
      {
        title: 'Choose a duration and confirm',
        body: 'Choose 5, 14 or 30 days and the start – “Immediately”, after the running sedcard, or on a certain date. Add it to the cart, accept the terms and click “Activate now”. During the current promotion activation is free – nothing is charged.',
      },
      {
        title: 'Check your visibility',
        body: 'After activation your sedcard appears in the model list, in search and in the regional filters. Your dashboard also shows how often your profile has been viewed.',
        href: '/dashboard/model/statistics',
        hrefLabel: 'View statistics',
      },
    ],
    qualityHeading: 'What makes a good sedcard',
    qualityIntro: 'Activation gets you into the list – the rest decides the clicks.',
    quality: [
      'A sharp, well-lit, recent cover picture – it is the only thing visible in the list.',
      'Several photos in a sensible order; your strongest picture goes first.',
      'A short description in your own words – standard texts quickly read like a mass profile.',
      'Complete rates and services, so requests suit you from the start.',
      'Keep your working hours up to date, so requests come when you can be reached.',
      'Set your city and area correctly – without them you drop out of the regional filters.',
    ],
    addonsTitle: 'Optional: extra ad spaces',
    addonsText:
      'If you want to stand out beyond your sedcard, you can book ad spaces in your dashboard: a wide banner in the feed, a card space in the grid, or one of the two vertical columns left and right of the list. On a smartphone the columns appear as a promo strip at the bottom. You also choose in which cantons your banner is shown.',
    addonsNote:
      'Ad spaces are optional and completely independent of whether your sedcard is visible – a normal listing works fine without them.',
    faqHeading: 'Frequently asked questions',
    faqs: [
      {
        q: 'What is a sedcard anyway?',
        a: 'The sedcard is your public listing: the card visitors see in the model list and in search, with your photos, your description and your details. You can update your profile in the dashboard at any time – it only becomes public through an active sedcard.',
      },
      {
        q: 'What does activation cost?',
        a: 'During the current promotion, sedcard activation is free. The process in the dashboard stays the same; the packages then show the promotion note instead of a price.',
      },
      {
        q: 'What happens when my sedcard expires?',
        a: 'It disappears from the public list, but your profile with its photos and details stays complete. You can activate it again at any time without filling anything in again.',
      },
      {
        q: 'Can I hide my sedcard temporarily?',
        a: 'Yes. Your dashboard has a visibility switch. If you turn it off, your sedcard is not publicly reachable anywhere – not even in the chat area – and you can turn it back on at any time.',
      },
      {
        q: 'How can I become even more visible?',
        a: 'Besides your sedcard you can book ad spaces: a wide banner in the feed, a card space in the grid, or one of the two vertical columns left and right of the list. These spaces are optional and independent of your sedcard.',
      },
    ],
    cta: {
      title: 'Activate your sedcard',
      text: 'Profile ready? Then bring it into the list – free during the promotion.',
      label: 'Go to dashboard',
    },
    crumbs: ['Home', 'Help'],
  },
}

export default async function HelpSedcardPage() {
  // German for German visitors; English for everyone else, as the guide has
  // only these two languages.
  const lang: Lang = (await getLocale()) === 'de' ? 'de' : 'en'
  const copy = COPY[lang]
  const [pre, profile, mid, sedcard, post] = copy.notSame

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: copy.title,
    description: copy.description,
    totalTime: 'PT10M',
    step: copy.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: copy.crumbs[0], path: '/' },
    { name: copy.crumbs[1], path: HELP_PATH },
    { name: copy.short, path: helpUrl(SLUG) },
  ])

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
        <HelpBreadcrumb current={copy.short} lang={lang} />

        <header className="mb-8">
          <h1 className="mb-4 text-2xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mb-4 text-sm leading-relaxed text-gray-600 sm:text-base">
            {copy.description}
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {copy.minutes}
          </span>
        </header>

        <section className="mb-12">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-xl">
            <PlayCircle className="h-5 w-5 text-brand" />
            {copy.demoHeading}
          </h2>
          <p className="mb-5 text-sm text-gray-500">{copy.demoIntro}</p>
          <div className="xl:-mx-16">
            <SedcardDemo lang={lang} />
          </div>
        </section>

        {/* What it is */}
        <section className="mb-12">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <Eye className="mb-2 h-6 w-6 text-brand" />
            <h2 className="mb-1.5 text-base font-bold text-gray-900">{copy.notSameTitle}</h2>
            <p className="text-sm leading-relaxed text-gray-600">
              {pre}<strong>{profile}</strong>{mid}<strong>{sedcard}</strong>{post}
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">{copy.stepsHeading}</h2>
          <p className="mb-5 text-sm text-gray-500">{copy.stepsIntro}</p>
          <HelpSteps steps={copy.steps} />
        </section>

        <section className="mb-12">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">{copy.qualityHeading}</h2>
          <p className="mb-5 text-sm text-gray-500">{copy.qualityIntro}</p>
          <ul className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-5">
            {copy.quality.map(item => (
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
            <h2 className="mb-1.5 text-base font-bold text-gray-900">{copy.addonsTitle}</h2>
            <p className="mb-3 text-sm leading-relaxed text-gray-600">{copy.addonsText}</p>
            <p className="text-xs text-gray-500">{copy.addonsNote}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-lg font-bold text-gray-900 sm:text-xl">{copy.faqHeading}</h2>
          <HelpFaqList faqs={copy.faqs} />
        </section>

        <HelpCta
          title={copy.cta.title}
          text={copy.cta.text}
          href="/dashboard/model/activate-ad"
          label={copy.cta.label}
        />

        <HelpRelated currentSlug={SLUG} lang={lang} />
      </main>

      <Footer />
    </>
  )
}
