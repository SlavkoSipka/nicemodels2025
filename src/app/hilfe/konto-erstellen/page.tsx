import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
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

// Metadata stays German like the rest of the Help Point: the locale comes from a
// cookie, not the URL, so there is no separate English URL to index.
export const metadata: Metadata = buildMetadata({
  path: helpUrl(SLUG),
  title: 'Konto erstellen – animierte Anleitung zur Registrierung',
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
  stepsHeading: string
  stepsIntro: string
  steps: HelpStep[]
  faqHeading: string
  faqs: HelpFaq[]
  cta: { title: string; text: string; label: string }
  crumbs: [string, string]
}

// The written version of what the animation shows, for readers who prefer
// text and for search engines (the animation itself is aria-hidden).
const COPY: Record<Lang, PageCopy> = {
  de: {
    title: topic.title,
    short: topic.short,
    description: topic.description,
    minutes: `ca. ${topic.minutes} Min.`,
    demoHeading: 'So sieht die Registrierung aus',
    demoIntro:
      'Die Anleitung spielt automatisch ab – wahlweise am Laptop oder am Handy. Mit «Zurück» und «Weiter» oder über die Leiste springst du zu jedem Schritt.',
    stepsHeading: 'Alle Schritte zum Nachlesen',
    stepsIntro: 'In rund zwei Minuten zum eigenen Konto.',
    steps: [
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
    ],
    faqHeading: 'Häufige Fragen',
    faqs: [
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
    ],
    cta: {
      title: 'Bereit?',
      text: 'Die Registrierung ist kostenlos und dauert nur ein paar Minuten.',
      label: 'Jetzt kostenlos registrieren',
    },
    crumbs: ['Startseite', 'Hilfe'],
  },
  en: {
    title: topic.en.title,
    short: topic.en.short,
    description: topic.en.description,
    minutes: `approx. ${topic.minutes} min.`,
    demoHeading: 'This is what signing up looks like',
    demoIntro:
      'The guide plays automatically – on a laptop or on a phone. Use “Back” and “Next” or the bar to jump to any step.',
    stepsHeading: 'All steps to read',
    stepsIntro: 'Your own account in about two minutes.',
    steps: [
      {
        title: 'Open registration',
        body: 'Click “Register” in the top right corner. On a phone, open the menu ☰ first and tap “Register” there. Signing up is completely free.',
        href: '/register',
        hrefLabel: 'Go to registration',
      },
      {
        title: 'Choose your user type',
        body: 'Choose between Member / Visitor, Independent Model and Agency / Club. For your own profile choose “Independent Model”, for a business “Agency / Club”.',
      },
      {
        title: 'Enter username, email and phone number',
        body: 'All three fields are required. You will sign in later with your email address and password. For the phone number, the Swiss code +41 is already selected.',
      },
      {
        title: 'Add your date of birth (optional)',
        body: 'Your date of birth is optional. If you enter it, you must be at least 18 years old.',
      },
      {
        title: 'Set and confirm your password',
        body: 'The password needs at least 6 characters and must be exactly the same in both fields.',
      },
      {
        title: 'Accept the terms and privacy policy',
        body: 'Tick both required boxes. The newsletter is optional.',
      },
      {
        title: 'Click “Register”',
        body: 'Your account is created right away and you are signed in. Models and clubs continue in onboarding; members go straight to their dashboard.',
        href: helpUrl('profil-erstellen'),
        hrefLabel: 'Next: create your profile (in German)',
      },
    ],
    faqHeading: 'Frequently asked questions',
    faqs: [
      {
        q: 'Does registration cost anything?',
        a: 'No. Creating an account is free. Only optional extras for more visibility are paid.',
      },
      {
        q: 'Which user type should I choose?',
        a: '“Independent Model” if you want to publish your own profile with a sedcard. “Agency / Club” if you represent a business. “Member / Visitor” if you want to use the site as a guest.',
      },
      {
        q: 'What happens right after registration?',
        a: 'You are signed in straight away. As a model or club, onboarding guides you through the first details; after that you submit your verification and set up your profile.',
      },
      {
        q: 'The site says my email is already registered – what now?',
        a: 'Then an account with this address already exists. Sign in, or set a new password via “Forgot password” if you no longer remember it.',
      },
      {
        q: 'I am stuck – who can help me?',
        a: 'Write to us via the contact form or on WhatsApp. We are happy to help you sign up.',
      },
    ],
    cta: {
      title: 'Ready?',
      text: 'Registration is free and only takes a few minutes.',
      label: 'Register for free now',
    },
    crumbs: ['Home', 'Help'],
  },
}

export default async function HelpKontoErstellenPage() {
  // German for German visitors; English for everyone else, as the guide has
  // only these two languages.
  const lang: Lang = (await getLocale()) === 'de' ? 'de' : 'en'
  const copy = COPY[lang]

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: copy.title,
    description: copy.description,
    totalTime: 'PT2M',
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
            <SignupDemo lang={lang} />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">{copy.stepsHeading}</h2>
          <p className="mb-5 text-sm text-gray-500">{copy.stepsIntro}</p>
          <HelpSteps steps={copy.steps} />
        </section>

        <section>
          <h2 className="mb-5 text-lg font-bold text-gray-900 sm:text-xl">{copy.faqHeading}</h2>
          <HelpFaqList faqs={copy.faqs} />
        </section>

        <HelpCta title={copy.cta.title} text={copy.cta.text} href="/register" label={copy.cta.label} />

        <HelpRelated currentSlug={SLUG} lang={lang} />
      </main>

      <Footer />
    </>
  )
}
