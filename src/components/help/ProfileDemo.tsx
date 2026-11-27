'use client'

import GuidePlayer, { type Beat, type GuideScript, type GuideStep } from './GuidePlayer'
import { DashboardOverlay, DashboardPage, dashHeader, dashTabTitle, dashUrl } from './DashboardDemoScreens'
import type { Device, Lang } from './SignupDemoScreens'

/**
 * Animated walkthrough of filling in a model profile: where the profile
 * sections are in the dashboard, and how to enter and save each kind of data.
 * Played by `GuidePlayer` on the dashboard copies in `DashboardDemoScreens`.
 */

/** Open a profile section: one click in the laptop sidebar, menu ☰ first on the phone. */
function section(target: string, screen: string, rest: Beat[]): Record<Device, Beat[]> {
  return {
    laptop: [{ at: target, click: true, go: screen }, ...rest],
    phone: [
      { at: 'nav-menu', click: true, set: ['drawer'] },
      { at: target, click: true, go: screen, unset: ['drawer'] },
      ...rest,
    ],
  }
}

/** Click "Save", then the confirmation at the top of the page. */
const save = (prefix: string, flag: string): Beat[] => [
  { at: `${prefix}-save`, click: true, set: [`${flag}Saving`] },
  { wait: 700, set: [`${flag}Saved`], unset: [`${flag}Saving`], show: `${prefix}-success` },
]

const ABOUT = {
  de: 'Hallo, ich bin Sandra – herzlich, gepflegt und diskret. Ich freue mich auf entspannte Stunden mit dir in meiner ruhigen Wohnung in Zürich. Schreib mir gerne eine Nachricht!',
  en: 'Hi, I am Sandra – warm, well-groomed and discreet. I look forward to relaxed hours with you in my quiet apartment in Zurich. Feel free to send me a message, I will reply soon!',
}

const STEPS: GuideStep[] = [
  {
    title: { de: 'Mein Profil öffnen', en: 'Open My Profile' },
    text: {
      de: {
        laptop: 'Nach dem Anmelden landest du im Dashboard. Klicke links auf «Mein Profil» – darunter findest du alle Bereiche deines Profils, von der Biografie bis zu den Tarifen.',
        phone: 'Nach dem Anmelden landest du im Dashboard. Tippe oben links auf das Menü ☰ und dann auf «Mein Profil» – darunter findest du alle Bereiche deines Profils.',
      },
      en: {
        laptop: 'After signing in you land in your dashboard. Click “My Profile” on the left – below it you find every section of your profile, from biography to rates.',
        phone: 'After signing in you land in your dashboard. Tap the menu ☰ in the top left, then “My Profile” – below it you find every section of your profile.',
      },
    },
    beats: {
      laptop: [{ at: 'nav-profile', click: true, set: ['profileOpen'] }],
      phone: [
        { at: 'nav-menu', click: true, set: ['drawer'] },
        { at: 'nav-profile', click: true, set: ['profileOpen'] },
      ],
    },
  },
  {
    title: { de: 'Biografie ausfüllen', en: 'Fill in your biography' },
    text: {
      de: 'Unter «Biografie» stehen Showname, Geschlecht, Alter und deine körperlichen Merkmale. Pflicht ist nur der Showname – er erscheint auf deiner Sedcard.',
      en: 'Under “Biography” you enter your showname, gender, age and physical features. Only the showname is required – it appears on your sedcard.',
    },
    beats: {
      laptop: [
        { at: 'nav-bio', click: true, go: 'bio' },
        { at: 'bio-showname', type: 'Sandra', kb: 'text' },
        { at: 'bio-gender', click: true, set: ['genderOpen'], reserve: 200 },
        { at: 'bio-gender-female', click: true, set: ['genderChosen'], unset: ['genderOpen'] },
        { at: 'bio-age', type: '28', kb: 'numeric' },
      ],
      phone: [
        { at: 'nav-bio', click: true, go: 'bio', unset: ['drawer'] },
        { at: 'bio-showname', type: 'Sandra', kb: 'text' },
        { at: 'bio-gender', click: true, set: ['genderOpen'], reserve: 200 },
        { at: 'bio-gender-female', click: true, set: ['genderChosen'], unset: ['genderOpen'] },
        { at: 'bio-age', type: '28', kb: 'numeric' },
      ],
    },
  },
  {
    title: { de: 'Änderungen speichern', en: 'Save your changes' },
    text: {
      de: {
        laptop: 'Klicke unten auf «Änderungen speichern» – oben erscheint die Bestätigung. Jeder Bereich wird einzeln gespeichert, du musst also nicht alles auf einmal ausfüllen.',
        phone: 'Tippe unten auf «Änderungen speichern» – oben erscheint die Bestätigung. Jeder Bereich wird einzeln gespeichert, du musst also nicht alles auf einmal ausfüllen.',
      },
      en: {
        laptop: 'Click “Save Changes” at the bottom – a confirmation appears at the top. Every section is saved on its own, so you don’t have to fill in everything at once.',
        phone: 'Tap “Save Changes” at the bottom – a confirmation appears at the top. Every section is saved on its own, so you don’t have to fill in everything at once.',
      },
    },
    beats: save('bio', 'bio'),
  },
  {
    title: { de: '«Über mich» schreiben', en: 'Write “About Me”' },
    text: {
      de: {
        laptop: 'Wechsle links zu «Über mich» und beschreibe dich in eigenen Worten – mindestens 150 Zeichen. Der Zähler unter dem Feld zeigt, wie weit du bist. Dann speichern.',
        phone: 'Öffne wieder das Menü ☰ und tippe auf «Über mich». Beschreibe dich in eigenen Worten – mindestens 150 Zeichen, der Zähler unter dem Feld hilft dir. Dann speichern.',
      },
      en: {
        laptop: 'Switch to “About Me” on the left and describe yourself in your own words – at least 150 characters. The counter below the field shows how far you are. Then save.',
        phone: 'Open the menu ☰ again and tap “About Me”. Describe yourself in your own words – at least 150 characters; the counter below the field helps. Then save.',
      },
    },
    beats: section('nav-about', 'about', [
      { at: 'about-text', type: ABOUT, kb: 'text', speed: 22 },
      ...save('about', 'about'),
    ]),
  },
  {
    title: { de: 'Kontaktdaten angeben', en: 'Add your contact details' },
    text: {
      de: 'Unter «Kontaktdaten» trägst du deine Telefonnummer ein und legst fest, ob sie im Profil erscheint und ob du per WhatsApp, Viber oder Telegram erreichbar bist.',
      en: 'Under “Contact Details” you enter your phone number and choose whether it shows on your profile and whether you can be reached on WhatsApp, Viber or Telegram.',
    },
    beats: section('nav-contact', 'contact', [
      { at: 'contact-show', click: true, set: ['showPhone'] },
      { at: 'contact-phone', type: '79 123 45 67', kb: 'numeric' },
      { at: 'contact-whatsapp', click: true, set: ['whatsapp'] },
      ...save('contact', 'contact'),
    ]),
  },
  {
    title: { de: 'Stadt und Gebiet festlegen', en: 'Set your city and area' },
    text: {
      de: 'Unter «Region / Adresse» suchst du deine Stadt oder PLZ und wählst sie aus der Liste – die PLZ wird automatisch ergänzt. Ohne Stadt erscheinst du nicht in den regionalen Filtern.',
      en: 'Under “Area / Address” search for your city or postal code and pick it from the list – the postal code fills in by itself. Without a city you don’t show up in the regional filters.',
    },
    beats: section('nav-area', 'area', [
      { at: 'area-city', type: 'Zür', kb: 'text' },
      { at: 'area-city-pick', click: true, set: ['cityPicked'] },
      { at: 'area-incall', click: true, set: ['incall'] },
      ...save('area', 'area'),
    ]),
  },
  {
    title: { de: 'Fotos hochladen', en: 'Upload photos' },
    text: {
      de: {
        laptop: 'Unter «Bilder / Video» klickst du auf «Fotos hochladen» und wählst deine Bilder aus (max. 10 MB pro Foto). Das erste Foto ist dein Titelbild – die Reihenfolge änderst du durch Ziehen.',
        phone: 'Unter «Bilder / Video» tippst du auf «Fotos hochladen» und wählst deine Bilder aus (max. 10 MB pro Foto). Das erste Foto ist dein Titelbild – die Reihenfolge änderst du durch Ziehen.',
      },
      en: {
        laptop: 'Under “Pictures / Video” click “Upload Photos” and pick your pictures (max 10 MB each). The first photo is your cover picture – drag photos to change the order.',
        phone: 'Under “Pictures / Video” tap “Upload Photos” and pick your pictures (max 10 MB each). The first photo is your cover picture – drag photos to change the order.',
      },
    },
    beats: section('nav-media', 'media', [
      { at: 'media-upload', click: true, set: ['uploading'] },
      { wait: 1400, set: ['photos'], unset: ['uploading'], show: 'media-photos' },
    ]),
  },
  {
    title: { de: 'Dienste und weitere Bereiche', en: 'Services and the other sections' },
    text: {
      de: 'Unter «Dienste» wählst du, für wen du da bist und welche Services du anbietest. «Sprachen», «Arbeitszeiten» und «Tarife» funktionieren genauso: auswählen, eintragen, speichern.',
      en: 'Under “Services” choose who you offer your services to and what you offer. “Languages”, “Working Hours” and “Rates” work the same way: pick, fill in, save.',
    },
    beats: section('nav-services', 'services', [
      { at: 'svc-men', click: true, set: ['forMen'] },
      { at: 'svc-couples', click: true, set: ['forCouples'] },
      { at: 'svc-massage', click: true, set: ['massageOpen'] },
      { at: 'svc-classical', click: true, set: ['svcClassical'] },
      ...save('svc', 'svc'),
    ]),
  },
  {
    title: { de: 'Fertig – dein Profil ist ausgefüllt', en: 'Done – your profile is filled in' },
    text: {
      de: 'Du kannst jeden Bereich jederzeit wieder öffnen und ändern. Öffentlich sichtbar wird dein Profil, sobald du deine Sedcard aktivierst.',
      en: 'You can reopen and change any section at any time. Your profile becomes public as soon as you activate your sedcard.',
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
  menuFlags: ['drawer', 'profileOpen', 'genderOpen'],
}

export default function ProfileDemo({ lang = 'de' }: { lang?: Lang }) {
  return <GuidePlayer script={SCRIPT} lang={lang} />
}
