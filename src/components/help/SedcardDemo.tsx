'use client'

import GuidePlayer, { type GuideScript, type GuideStep } from './GuidePlayer'
import { DashboardOverlay, DashboardPage, dashHeader, dashTabTitle, dashUrl } from './DashboardDemoScreens'
import type { Lang } from './SignupDemoScreens'

/**
 * Animated walkthrough of activating the sedcard, from the sidebar button to
 * the confirmation, while activation is free for models. Played by
 * `GuidePlayer` on the dashboard copies in `DashboardDemoScreens`.
 */

const STEPS: GuideStep[] = [
  {
    title: { de: '«Sedcard aktivieren» öffnen', en: 'Open “Activate Sedcard”' },
    text: {
      de: {
        laptop: 'Ist dein Profil ausgefüllt, klicke im Dashboard links auf den orangen Button «Sedcard aktivieren».',
        phone: 'Ist dein Profil ausgefüllt, tippe oben links auf das Menü ☰ und dann auf den orangen Button «Sedcard aktivieren».',
      },
      en: {
        laptop: 'Once your profile is filled in, click the orange “Activate Sedcard” button on the left of your dashboard.',
        phone: 'Once your profile is filled in, tap the menu ☰ in the top left, then the orange “Activate Sedcard” button.',
      },
    },
    beats: {
      laptop: [{ at: 'nav-sedcard', click: true, go: 'activate' }],
      phone: [
        { at: 'nav-menu', click: true, set: ['drawer'] },
        { at: 'nav-sedcard', click: true, go: 'activate', unset: ['drawer'] },
      ],
    },
  },
  {
    title: { de: 'Profil noch einmal prüfen', en: 'Check your profile once more' },
    text: {
      de: 'Oben steht, was vor dem Start passen sollte: Name und Beschreibung, Standort, Alter und Services, mindestens 3 Fotos und korrekte Kontaktdaten. Darunter zeigt die Vorschau, wo deine Karte erscheint.',
      en: 'At the top you see what should be in place before you start: name and description, location, age and services, at least 3 photos and correct contact details. Below, the preview shows where your card will appear.',
    },
    beats: [],
  },
  {
    title: { de: 'Laufzeit wählen', en: 'Choose a duration' },
    text: {
      de: 'Wähle, wie lange deine Sedcard sichtbar sein soll: 5, 14 oder 30 Tage. Zurzeit ist die Aktivierung für Models kostenlos.',
      en: 'Choose how long your sedcard should be visible: 5, 14 or 30 days. Activation is currently free for models.',
    },
    beats: [{ at: 'act-pkg30', click: true, set: ['pkg30'] }],
  },
  {
    title: { de: 'Start festlegen', en: 'Choose when it starts' },
    text: {
      de: '«Sofort» ist vorausgewählt. Mit «Nach aktueller» schliesst die neue Laufzeit an eine laufende an, mit «An bestimmtem Datum» legst du den Start selbst fest.',
      en: '“Immediately” is selected by default. “After current” starts the new period when the running one ends; “At certain date” lets you pick the start yourself.',
    },
    beats: [{ at: 'act-now', click: true }],
  },
  {
    title: { de: 'In den Warenkorb legen', en: 'Add it to the cart' },
    text: {
      de: {
        laptop: 'Klicke auf «In den Warenkorb». Darunter erscheint dein Warenkorb mit der gewählten Laufzeit.',
        phone: 'Tippe auf «In den Warenkorb». Darunter erscheint dein Warenkorb mit der gewählten Laufzeit.',
      },
      en: {
        laptop: 'Click “Add to cart”. Your cart with the chosen duration appears below.',
        phone: 'Tap “Add to cart”. Your cart with the chosen duration appears below.',
      },
    },
    beats: [{ at: 'act-add', click: true, set: ['inCart'] }],
  },
  {
    title: { de: 'AGB akzeptieren', en: 'Accept the terms' },
    text: {
      de: 'Setze das Häkchen bei den AGB und der Datenschutzerklärung – erst dann lässt sich die Aktivierung bestätigen.',
      en: 'Tick the box for the terms and the privacy policy – only then can the activation be confirmed.',
    },
    beats: [{ at: 'act-terms', click: true, set: ['terms'] }],
  },
  {
    title: { de: '«Jetzt aktivieren»', en: '“Activate now”' },
    text: {
      de: {
        laptop: 'Klicke auf «Jetzt aktivieren». Es fällt keine Zahlung an – deine Sedcard wird sofort freigeschaltet.',
        phone: 'Tippe auf «Jetzt aktivieren». Es fällt keine Zahlung an – deine Sedcard wird sofort freigeschaltet.',
      },
      en: {
        laptop: 'Click “Activate now”. No payment is taken – your sedcard goes live right away.',
        phone: 'Tap “Activate now”. No payment is taken – your sedcard goes live right away.',
      },
    },
    beats: [
      { at: 'act-confirm', click: true },
      { wait: 500, go: 'success' },
    ],
  },
  {
    title: { de: 'Fertig – deine Sedcard ist online', en: 'Done – your sedcard is live' },
    text: {
      de: 'Deine Sedcard erscheint jetzt in der Model-Liste und in der Suche. Wann sie abläuft, siehst du unter «Sedcard aktivieren», deine Bestellungen unter «Kaufhistorie».',
      en: 'Your sedcard now appears in the model list and in search. You can see when it expires under “Activate Sedcard”, and your orders under “Purchase History”.',
    },
    beats: [],
  },
]

const SCRIPT: GuideScript = {
  steps: STEPS,
  initialScreen: 'home',
  url: dashUrl,
  tabTitle: dashTabTitle,
  headerHeight: dashHeader,
  renderPage: v => <DashboardPage {...v} />,
  renderOverlay: v => <DashboardOverlay {...v} />,
  menuFlags: ['drawer'],
}

export default function SedcardDemo({ lang = 'de' }: { lang?: Lang }) {
  return <GuidePlayer script={SCRIPT} lang={lang} />
}
