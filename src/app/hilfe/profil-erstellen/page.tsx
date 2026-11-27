import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CheckCircle2, Clock, PlayCircle, ShieldCheck } from 'lucide-react'
import { buildMetadata, buildBreadcrumbJsonLd } from '@/lib/seo'
import { HELP_PATH, helpTopic, helpUrl } from '@/lib/helpTopics'
import ProfileDemo from '@/components/help/ProfileDemo'
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

// Metadata stays German like the rest of the Help Point: the locale comes from a
// cookie, not the URL, so there is no separate English URL to index.
export const metadata: Metadata = buildMetadata({
  path: helpUrl(SLUG),
  title: 'Profil erstellen – Schritt-für-Schritt-Anleitung',
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
  completeHeading: string
  completeIntro: string
  completeness: string[]
  privacyNote: string
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
    demoHeading: 'So trägst du deine Daten ein',
    demoIntro:
      'Die Anleitung zeigt, wo du im Dashboard die einzelnen Profilbereiche findest und wie du sie ausfüllst und speicherst – wahlweise am Laptop oder am Handy. Mit «Zurück» und «Weiter» oder über die Leiste springst du zu jedem Schritt.',
    stepsHeading: 'In sechs Schritten online',
    stepsIntro: 'Von der Registrierung bis zur sichtbaren Sedcard.',
    steps: [
      {
        title: 'Konto registrieren',
        body: 'Wähle auf der Registrierungsseite «Unabhängiges Model» und leg dein Konto mit E-Mail-Adresse und Passwort an. Die Registrierung ist kostenlos und dauert nur wenige Minuten.',
        href: helpUrl('konto-erstellen'),
        hrefLabel: 'Animierte Anleitung: Konto erstellen',
      },
      {
        title: 'Onboarding ausfüllen',
        body: 'Direkt nach der Registrierung bist du eingeloggt und landest im Onboarding. Dort machst du die ersten Angaben wie Künstlername, Geschlecht, Alter und Herkunft; danach geht es in dein Dashboard.',
      },
      {
        title: 'Verifizierung einreichen',
        body: 'Lade im Dashboard unter Verifizierung ein gut lesbares Foto deines Personalausweises oder Reisepasses hoch, dazu ein Selfie, auf dem du das Dokument neben dein Gesicht hältst. Ein kurzes Video ist optional und kann die Prüfung beschleunigen. Unser Team prüft die Unterlagen manuell, in der Regel innerhalb von 24 bis 48 Stunden.',
        href: '/dashboard/model/verification',
        hrefLabel: 'Verifizierung öffnen',
      },
      {
        title: 'Profilangaben ausfüllen',
        body: 'Unter «Mein Profil» findest du die einzelnen Bereiche: Biografie, Über mich, Kontaktdaten, Region / Adresse, Bilder / Video, Sprachen, Dienste, Arbeitszeiten und Tarife. Jeder Bereich wird einzeln gespeichert und lässt sich jederzeit anpassen – du musst nicht alles auf einmal erledigen.',
        href: '/dashboard/model/profile/biography',
        hrefLabel: 'Profil bearbeiten',
      },
      {
        title: 'Fotos und Videos hochladen',
        body: 'Unter «Bilder / Video» lädst du deine Medien hoch – pro Foto maximal 10 MB. Die Reihenfolge bestimmst du selbst; das erste Bild ist dein Titelbild und entscheidet massgeblich darüber, ob jemand deine Karte anklickt.',
        href: '/dashboard/model/profile/pictures-video',
        hrefLabel: 'Medien verwalten',
      },
      {
        title: 'Sedcard aktivieren',
        body: 'Ein ausgefülltes Profil ist noch nicht öffentlich sichtbar. Erst wenn du deine Sedcard aktivierst, erscheint sie in der Liste und in der Suche. Wie das geht, zeigt die Sedcard-Anleitung.',
        href: helpUrl('sedcard'),
        hrefLabel: 'Zur Sedcard-Anleitung',
      },
    ],
    completeHeading: 'Was ein vollständiges Profil ausmacht',
    completeIntro: 'Diese Angaben entscheiden darüber, wie oft dein Profil gefunden und geöffnet wird.',
    completeness: [
      'Ein scharfes, aktuelles Titelbild – es entscheidet über den ersten Klick.',
      'Mehrere Fotos statt nur einem: Profile mit einer Bildergalerie werden deutlich länger angesehen.',
      'Eine persönlich geschriebene Beschreibung statt kopierter Standardtexte.',
      'Stadt und Einsatzgebiet, damit du in den regionalen Filtern überhaupt auftauchst.',
      'Sprachen, Services und Preise – das sind die Angaben, nach denen am häufigsten gefiltert wird.',
      'Arbeitszeiten und Kontaktweg, damit Anfragen zur richtigen Zeit über den richtigen Kanal kommen.',
    ],
    privacyNote:
      'Du entscheidest bei jedem Feld selbst, was du teilst. Angaben, die du leer lässt, erscheinen auch nicht auf deinem öffentlichen Profil.',
    faqHeading: 'Häufige Fragen',
    faqs: [
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
    ],
    cta: {
      title: 'Bereit für dein Profil?',
      text: 'Die Registrierung dauert nur wenige Minuten – nach der Prüfung geht dein Profil live.',
      label: 'Jetzt kostenlos registrieren',
    },
    crumbs: ['Startseite', 'Hilfe'],
  },
  en: {
    title: topic.en.title,
    short: topic.en.short,
    description: topic.en.description,
    minutes: `approx. ${topic.minutes} min. read`,
    demoHeading: 'How to enter your details',
    demoIntro:
      'The guide shows where to find each profile section in your dashboard and how to fill it in and save it – on a laptop or on a phone. Use “Back” and “Next” or the bar to jump to any step.',
    stepsHeading: 'Online in six steps',
    stepsIntro: 'From registration to a visible sedcard.',
    steps: [
      {
        title: 'Register an account',
        body: 'On the registration page choose “Independent Model” and create your account with an email address and password. Registration is free and only takes a few minutes.',
        href: helpUrl('konto-erstellen'),
        hrefLabel: 'Animated guide: create an account',
      },
      {
        title: 'Complete onboarding',
        body: 'Right after registering you are signed in and land in onboarding. There you add your first details such as showname, gender, age and background; after that you go to your dashboard.',
      },
      {
        title: 'Submit your verification',
        body: 'In your dashboard under Verification, upload a clearly readable photo of your ID card or passport, plus a selfie holding the document next to your face. A short video is optional and can speed up the check. Our team reviews the documents by hand, usually within 24 to 48 hours.',
        href: '/dashboard/model/verification',
        hrefLabel: 'Open verification',
      },
      {
        title: 'Fill in your profile details',
        body: 'Under “My Profile” you find the individual sections: Biography, About Me, Contact Details, Area / Address, Pictures / Video, Languages, Services, Working Hours and Rates. Each section is saved on its own and can be changed at any time – you don’t have to do everything at once.',
        href: '/dashboard/model/profile/biography',
        hrefLabel: 'Edit profile',
      },
      {
        title: 'Upload photos and videos',
        body: 'Under “Pictures / Video” you upload your media – up to 10 MB per photo. You decide the order; the first picture is your cover picture and largely decides whether someone clicks your card.',
        href: '/dashboard/model/profile/pictures-video',
        hrefLabel: 'Manage media',
      },
      {
        title: 'Activate your sedcard',
        body: 'A filled-in profile is not public yet. Only when you activate your sedcard does it appear in the list and in search. The sedcard guide shows how.',
        href: helpUrl('sedcard'),
        hrefLabel: 'Go to the sedcard guide',
      },
    ],
    completeHeading: 'What makes a complete profile',
    completeIntro: 'These details decide how often your profile is found and opened.',
    completeness: [
      'A sharp, recent cover picture – it decides the first click.',
      'Several photos instead of just one: profiles with a gallery are viewed for much longer.',
      'A description in your own words instead of copied standard texts.',
      'City and area, so that you show up in the regional filters at all.',
      'Languages, services and rates – the details visitors filter by most often.',
      'Working hours and how to reach you, so requests come at the right time through the right channel.',
    ],
    privacyNote:
      'For every field you decide yourself what you share. Details you leave empty do not appear on your public profile either.',
    faqHeading: 'Frequently asked questions',
    faqs: [
      {
        q: 'Does creating a profile cost anything?',
        a: 'No. Registration, profile and management are free. Only optional extras for more visibility are paid, such as banner ad spaces – but they are never required for a normal listing.',
      },
      {
        q: 'How long does the verification check take?',
        a: 'The documents are checked by hand, usually within 24 to 48 hours. While the check is running, your profile is not yet visible to visitors.',
      },
      {
        q: 'Is my ID published?',
        a: 'No. Your ID document and selfie are used only for the internal age check and identity confirmation. They do not appear anywhere on your public profile.',
      },
      {
        q: 'Do I have to fill in the whole profile in one go?',
        a: 'No. Each profile section is saved on its own. You can come back, add and change things at any time – even after your sedcard is already active.',
      },
      {
        q: 'Can I hide my profile again later?',
        a: 'Yes. Your dashboard has a switch for your sedcard’s visibility. If you turn it off, your profile disappears from the list but stays with all its content.',
      },
    ],
    cta: {
      title: 'Ready for your profile?',
      text: 'Registration only takes a few minutes – after the check your profile goes live.',
      label: 'Register for free now',
    },
    crumbs: ['Home', 'Help'],
  },
}

export default async function HelpProfilErstellenPage() {
  // German for German visitors; English for everyone else, as the guide has
  // only these two languages.
  const lang: Lang = (await getLocale()) === 'de' ? 'de' : 'en'
  const copy = COPY[lang]

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: copy.title,
    description: copy.description,
    totalTime: 'PT15M',
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
            <ProfileDemo lang={lang} />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">{copy.stepsHeading}</h2>
          <p className="mb-5 text-sm text-gray-500">{copy.stepsIntro}</p>
          <HelpSteps steps={copy.steps} />
        </section>

        <section className="mb-12">
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">{copy.completeHeading}</h2>
          <p className="mb-5 text-sm text-gray-500">{copy.completeIntro}</p>
          <ul className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-5">
            {copy.completeness.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {copy.privacyNote}
          </p>
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
