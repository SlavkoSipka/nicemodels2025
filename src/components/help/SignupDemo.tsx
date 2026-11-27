'use client'

import GuidePlayer, { type GuideScript, type GuideStep } from './GuidePlayer'
import { DEVICE, PageBody, SiteHeader, tabTitle, type Flag, type Lang, type Screen, type Target } from './SignupDemoScreens'

/**
 * Animated walkthrough of the signup, played by `GuidePlayer` on a copy of the
 * real pages (home, /register, /onboarding) from `SignupDemoScreens`.
 */

const STEPS: GuideStep[] = [
  {
    title: { de: 'Registrierung öffnen', en: 'Open registration' },
    text: {
      de: {
        laptop: 'Klicke oben rechts auf «Registrieren». Die Registrierung ist komplett kostenlos.',
        phone: 'Tippe oben rechts auf das Menü ☰ und dann auf «Registrieren». Die Registrierung ist komplett kostenlos.',
      },
      en: {
        laptop: 'Click “Register” in the top right corner. Signing up is completely free.',
        phone: 'Tap the menu ☰ in the top right corner, then “Register”. Signing up is completely free.',
      },
    },
    beats: {
      laptop: [{ at: 'nav-register', click: true, set: ['registerOpen'] }],
      phone: [
        { at: 'nav-menu', click: true, set: ['menuOpen'] },
        { at: 'menu-register', click: true, set: ['registerOpen'], unset: ['menuOpen'] },
      ],
    },
  },
  {
    title: { de: 'Benutzertyp wählen', en: 'Choose your user type' },
    text: {
      de: 'Wähle, wer du bist: Mitglied / Besucher, Unabhängiges Model oder Agentur / Club. Für ein eigenes Profil wählst du «Unabhängiges Model».',
      en: 'Pick who you are: Member / Visitor, Independent Model or Agency / Club. For your own profile, choose “Independent Model”.',
    },
    beats: [
      { at: 'type', click: true, set: ['typeOpen'], reserve: 210 },
      { at: 'type-model', click: true, set: ['typeChosen'], unset: ['typeOpen'] },
    ],
  },
  {
    title: { de: 'Benutzername eingeben', en: 'Enter a username' },
    text: { de: 'Wähle einen Benutzernamen für dein Konto.', en: 'Choose a username for your account.' },
    beats: [{ at: 'username', type: 'Sandra_ZH', kb: 'text' }],
  },
  {
    title: { de: 'E-Mail-Adresse eingeben', en: 'Enter your email address' },
    text: {
      de: 'Mit dieser Adresse und deinem Passwort meldest du dich später an. Verwende eine Adresse, auf die du Zugriff hast.',
      en: 'You will sign in later with this address and your password. Use an address you have access to.',
    },
    beats: [{ at: 'email', type: { de: 'sandra@beispiel.ch', en: 'sandra@example.com' }, kb: 'email' }],
  },
  {
    title: { de: 'Telefonnummer eingeben', en: 'Enter your phone number' },
    text: {
      de: 'Pflichtfeld. Die Schweizer Vorwahl +41 ist schon ausgewählt – bei einer anderen Nummer wählst du links das passende Land.',
      en: 'Required. The Swiss code +41 is already selected – for a number from another country, pick it on the left.',
    },
    beats: [{ at: 'phone', type: '79 123 45 67', kb: 'numeric' }],
  },
  {
    title: { de: 'Geburtsdatum (freiwillig)', en: 'Date of birth (optional)' },
    text: {
      de: 'Dieses Feld ist optional. Wenn du es ausfüllst, musst du mindestens 18 Jahre alt sein.',
      en: 'This field is optional. If you fill it in, you must be at least 18 years old.',
    },
    beats: [{ at: 'dob', type: '14.03.1996', kb: 'numeric' }],
  },
  {
    title: { de: 'Passwort festlegen', en: 'Set a password' },
    text: {
      de: 'Mindestens 6 Zeichen. Mit dem Augen-Symbol kannst du dein Passwort beim Tippen sichtbar machen.',
      en: 'At least 6 characters. Use the eye icon to show your password while you type.',
    },
    beats: [{ at: 'password', type: 'sommer2024', kb: 'text' }],
  },
  {
    title: { de: 'Passwort bestätigen', en: 'Confirm your password' },
    text: {
      de: 'Gib dasselbe Passwort noch einmal ein. Beide Felder müssen genau übereinstimmen.',
      en: 'Enter the same password again. Both fields must match exactly.',
    },
    beats: [{ at: 'confirm', type: 'sommer2024', kb: 'text' }],
  },
  {
    title: { de: 'AGB und Datenschutz akzeptieren', en: 'Accept the terms and privacy policy' },
    text: {
      de: 'Beide Häkchen sind Pflicht. Der Newsletter darunter ist freiwillig.',
      en: 'Both boxes are required. The newsletter below is optional.',
    },
    beats: [
      { at: 'terms', click: true, set: ['terms'] },
      { at: 'privacy', click: true, set: ['privacy'] },
    ],
  },
  {
    title: { de: 'Auf «Registrieren» klicken', en: 'Click “Register”' },
    text: { de: 'Ein Klick – und dein Konto wird erstellt.', en: 'One click – and your account is created.' },
    beats: [{ at: 'submit', click: true, set: ['submitting'] }],
  },
  {
    title: { de: 'Fertig – dein Konto ist da', en: 'Done – your account is ready' },
    text: {
      de: 'Du bist sofort eingeloggt und landest im Onboarding, wo du die ersten Profilangaben machst. Als Mitglied geht es direkt ins Dashboard.',
      en: 'You are signed in straight away and land in onboarding, where you add your first profile details. Members go straight to their dashboard.',
    },
    beats: [],
  },
]

const LAST = STEPS.length - 1

const SCRIPT: GuideScript = {
  steps: STEPS,
  initialScreen: 'home',
  screenFor: (step, s) => (step === LAST ? 'onboarding' : s.flags.includes('registerOpen') ? 'register' : 'home'),
  url: screen => (screen === 'home' ? 'nicemodels.ch' : `nicemodels.ch/${screen}`),
  tabTitle: (screen, lang) => tabTitle(lang, screen as Screen),
  headerHeight: device => DEVICE[device].header,
  renderPage: v => (
    <PageBody
      device={v.device}
      screen={v.screen as Screen}
      lang={v.lang}
      has={f => v.has(f)}
      text={t => v.text(t)}
      focus={v.focus as Target | null}
    />
  ),
  // Solid backing and a 1px overlap hide sub-pixel seams that scaling opens between the header bars.
  renderOverlay: v => (
    <div className="absolute inset-x-0 z-10" style={{ top: -1, paddingTop: 1, background: '#e8f4fd', transform: 'translateZ(0)' }}>
      <SiteHeader device={v.device} screen={v.screen as Screen} lang={v.lang} has={(f: Flag) => v.has(f)} />
    </div>
  ),
  showPointer: screen => screen !== 'onboarding',
  menuFlags: ['menuOpen', 'typeOpen'],
}

export default function SignupDemo({ lang = 'de' }: { lang?: Lang }) {
  return <GuidePlayer script={SCRIPT} lang={lang} />
}
