import Image from 'next/image'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Delete,
  Eye,
  Globe,
  Lock,
  MapPin,
  Menu,
  Plus,
  RotateCw,
  Search,
  User,
  X,
} from 'lucide-react'

/**
 * Pixel-faithful copies of the screens a new user walks through — home, /register
 * and /onboarding — drawn at real device resolution (1280×800 laptop, 390×844
 * phone) for the animated signup guide. Markup and classes mirror Navbar,
 * RegisterForm, PhoneInput and the onboarding page; responsive prefixes are
 * replaced by an explicit `device` switch, because the copy is laid out at the
 * device's width, not the viewer's. Wording follows the site in German or
 * English (`messages/de.json`, `messages/en.json`).
 *
 * Nothing here is interactive: `SignupDemo` scales it into a device frame,
 * hides it from assistive tech and drives it through `ScreenProps`.
 */

export type Device = 'laptop' | 'phone'
export type Screen = 'home' | 'register' | 'onboarding'
export type Lang = 'de' | 'en'

export type Target =
  | 'nav-register' | 'nav-menu' | 'menu-register'
  | 'type' | 'type-model' | 'username' | 'email' | 'phone' | 'dob'
  | 'password' | 'confirm' | 'terms' | 'privacy' | 'submit'

export type Flag = 'menuOpen' | 'registerOpen' | 'typeOpen' | 'typeChosen' | 'terms' | 'privacy' | 'submitting'

export type KbLayout = 'text' | 'email' | 'numeric'

export const DEVICE = {
  laptop: { w: 1280, h: 800, chrome: 78, header: 105 },
  phone: { w: 390, h: 844, chrome: 97, header: 49 },
} as const

export const KB_HEIGHT: Record<KbLayout, number> = { text: 291, email: 291, numeric: 251 }

/** On-screen wording of the copied pages, as the live site shows it in each language. */
const UI = {
  de: {
    nav: ['Models', 'Clubs / Agentur', 'Jobs / Miete', 'Neueste Aktionen', 'Kommentare', 'Kontakt', 'Blog', 'Hilfe'],
    flag: '🇩🇪',
    langCode: 'DE',
    register: 'Registrieren',
    login: 'Anmelden',
    signInTab: 'Anmelden',
    logout: 'Abmelden',
    tabs: { title: { home: 'NiceModels.ch – Das Erotikportal der Schweiz', register: 'Registrieren | NiceModels.ch', onboarding: 'Onboarding | NiceModels.ch' } },
    homeH1: 'Escort Models & Clubs in der Schweiz',
    filters: ['Region', 'Stadt, PLZ oder Live-Standort', 'Alle Karten durchsuchen...'],
    leftHeading: 'Ihr persönlicher Zugang in einer Minute.',
    leftSubtitle: 'Hochwertig und kostenlos.',
    bullets: [
      'Komplett kostenlose Registrierung',
      'Hohe Sicherheitsstandards',
      'Eigenes Dashboard zum Verwalten',
      'Erhöhe deine Sichtbarkeit',
      'Schweizer Qualitätsstandards',
    ],
    guideLink: 'Wie funktioniert die Registrierung? Animierte Anleitung ansehen',
    haveAccount: 'Sie haben bereits ein Konto?',
    signInHere: 'Hier anmelden',
    modelAgency: 'Model oder Agentur?',
    modelAgencyLink: 'Mehr über Verifizierung & Ablauf erfahren',
    formTitle: 'Neues Konto erstellen',
    userType: 'Benutzertyp',
    typeOptions: ['Wer sind Sie?', 'Mitglied / Besucher', 'Unabhängiges Model', 'Agentur / Club'],
    username: 'Benutzername',
    email: 'E-Mail',
    phone: 'Telefonnummer',
    dob: 'Geburtsdatum',
    dobHint: '(mindestens 18 Jahre)',
    password: 'Passwort',
    confirm: 'Passwort bestätigen',
    acceptPre: 'Ich akzeptiere die',
    terms: 'Allgemeinen Geschäftsbedingungen',
    privacy: 'Datenschutzerklärung',
    newsletter: 'Newsletter abonnieren',
    submitting: 'Konto wird erstellt...',
    welcome: 'Willkommen bei ',
    obSubtitle: ['Vervollständige dein Profil, damit wir deine ', 'Model', '- oder ', 'Club/Agentur', '-Seite vorbereiten können. Profileinrichtung und Anzeigenaktivierung sind kostenlos; Banner und Inserate sind kostenpflichtige Leistungen.'],
    obTitle: 'Basis-BIO',
    obFields: [
      { label: 'Künstlername', ph: 'Name auf Ihrem Profil', select: false },
      { label: 'Geschlecht', ph: 'Geschlecht wählen', select: true },
      { label: 'Alter', ph: 'Alter', select: false },
      { label: 'Herkunft', ph: 'Herkunft wählen', select: true },
    ],
    kbRows: ['qwertzuiopü', 'asdfghjklöä', 'yxcvbnm'],
    kbSpace: 'Leerzeichen',
    kbReturn: 'Return',
    quickType: ['„“', 'Danke', 'Hallo'],
  },
  en: {
    nav: ['Models', 'Clubs / Agency', 'Jobs / Rent', 'Latest Actions', 'Comments', 'Contact', 'Blog', 'Help'],
    flag: '🇬🇧',
    langCode: 'EN',
    register: 'Register',
    login: 'Log in',
    signInTab: 'Sign in',
    logout: 'Logout',
    tabs: { title: { home: 'NiceModels.ch – Das Erotikportal der Schweiz', register: 'Register | NiceModels.ch', onboarding: 'Onboarding | NiceModels.ch' } },
    homeH1: 'Escort Models & Clubs in Switzerland',
    filters: ['Region', 'City, postal code, or live location', 'Search all cards...'],
    leftHeading: 'Your personal login in one minute.',
    leftSubtitle: 'High-quality and free.',
    bullets: [
      'Absolutely free registration',
      'High security standards',
      'Your own dashboard to manage',
      'Increase your visibility',
      'Swiss company quality standards',
    ],
    guideLink: 'How does registration work? Watch the animated guide',
    haveAccount: 'Already have an account?',
    signInHere: 'Sign in here',
    modelAgency: 'Model or agency?',
    modelAgencyLink: 'Learn more about verification & the process',
    formTitle: 'Create new account',
    userType: 'User type',
    typeOptions: ['Who are you?', 'Member / Visitor', 'Independent Model', 'Agency / Club'],
    username: 'Username',
    email: 'Email',
    phone: 'Phone number',
    dob: 'Date of birth',
    dobHint: '(must be 18+)',
    password: 'Password',
    confirm: 'Confirm password',
    acceptPre: 'I accept the',
    terms: 'terms and conditions',
    privacy: 'privacy policy',
    newsletter: 'Subscribe to newsletter',
    submitting: 'Creating account...',
    welcome: 'Welcome to ',
    obSubtitle: ['Complete your profile so we can prepare your ', 'model', ' or ', 'club/agency', ' page. Profile setup and ad activation are free; banners and listings are paid services.'],
    obTitle: 'Basic BIO',
    obFields: [
      { label: 'Showname', ph: 'Name on your profile', select: false },
      { label: 'Gender', ph: 'Select gender', select: true },
      { label: 'Age', ph: 'Age', select: false },
      { label: 'Background', ph: 'Select background', select: true },
    ],
    kbRows: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'],
    kbSpace: 'space',
    kbReturn: 'return',
    quickType: ['I', 'The', 'I’m'],
  },
} as const

export const tabTitle = (lang: Lang, screen: Screen) => UI[lang].tabs.title[screen]

export interface ScreenProps {
  device: Device
  screen: Screen
  lang: Lang
  has: (f: Flag) => boolean
  text: (t: Target) => string
  focus: Target | null
}

const SECRET: Target[] = ['password', 'confirm']

/* ───────────────────────── Browser chrome ───────────────────────── */

export function BrowserChrome({ device, url, title }: { device: Device; url: string; title: string }) {
  if (device === 'phone') {
    return (
      <div style={{ height: DEVICE.phone.chrome }} className="relative bg-white">
        {/* Status bar */}
        <div className="flex h-[47px] items-center justify-between px-[30px] pt-[6px] text-[16px] font-semibold text-black">
          <span className="w-[54px] text-center">9:41</span>
          <span className="flex items-center gap-[6px]">
            <span className="flex items-end gap-[2px]">
              {[5, 8, 11, 14].map(h => (
                <span key={h} className="w-[3px] rounded-[1px] bg-black" style={{ height: h }} />
              ))}
            </span>
            <svg width="17" height="12" viewBox="0 0 17 12" aria-hidden>
              <path d="M8.5 2.2c2.4 0 4.6.9 6.2 2.5l1.2-1.2C14 1.6 11.4.5 8.5.5S3 1.6 1.1 3.5l1.2 1.2C3.9 3.1 6.1 2.2 8.5 2.2zm0 3.4c1.5 0 2.8.6 3.8 1.5L13.5 6c-1.3-1.2-3-2-5-2s-3.7.8-5 2l1.2 1.1c1-.9 2.3-1.5 3.8-1.5zm0 3.4c.6 0 1.1.2 1.5.6L8.5 11.1 7 9.6c.4-.4.9-.6 1.5-.6z" fill="#000" />
            </svg>
            <span className="relative flex h-[12px] w-[25px] items-center rounded-[4px] border border-black/40 p-[1.5px]">
              <span className="h-full w-[80%] rounded-[2px] bg-black" />
              <span className="absolute -right-[3px] h-[4px] w-[1.5px] rounded-r bg-black/40" />
            </span>
          </span>
        </div>
        {/* Dynamic Island */}
        <span className="absolute left-1/2 top-[11px] h-[35px] w-[122px] -translate-x-1/2 rounded-full bg-black" />
        {/* Address bar */}
        <div className="flex h-[50px] items-center border-b border-gray-200 px-[12px]">
          <div className="flex h-[38px] flex-1 items-center justify-center gap-[6px] rounded-full bg-[#eceef1] text-[15px] text-gray-800">
            <Lock className="h-[13px] w-[13px] text-gray-500" />
            {url}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: DEVICE.laptop.chrome }} className="bg-white">
      <div className="relative flex h-[40px] items-end bg-[#dfe3e8] pl-[84px] pr-3">
        <span className="absolute left-[16px] top-[14px] flex gap-[8px]">
          <span className="h-[12px] w-[12px] rounded-full bg-[#ff5f57]" />
          <span className="h-[12px] w-[12px] rounded-full bg-[#febc2e]" />
          <span className="h-[12px] w-[12px] rounded-full bg-[#28c840]" />
        </span>
        <div className="flex h-[32px] w-[250px] items-center gap-2 rounded-t-[9px] bg-white px-3 text-[12px] text-gray-700">
          <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] bg-[#ec4899] text-[9px] font-black italic text-white">n</span>
          <span className="flex-1 truncate">{title}</span>
          <X className="h-3 w-3 shrink-0 text-gray-500" />
        </div>
        <Plus className="mb-[9px] ml-3 h-4 w-4 text-gray-600" />
      </div>
      <div className="flex h-[38px] items-center gap-4 border-b border-gray-200 px-4">
        <ArrowLeft className="h-4 w-4 text-gray-500" />
        <ArrowRight className="h-4 w-4 text-gray-300" />
        <RotateCw className="h-[15px] w-[15px] text-gray-500" />
        <div className="flex h-[28px] flex-1 items-center gap-2 rounded-full bg-[#f1f3f4] px-4 text-[13px] text-gray-800">
          <Lock className="h-[13px] w-[13px] text-gray-500" />
          {url}
        </div>
        <span className="h-[22px] w-[22px] rounded-full bg-gradient-to-br from-pink-300 to-pink-500" />
      </div>
    </div>
  )
}

/* ───────────────────────── Site header (Navbar) ───────────────────────── */

export function SiteHeader({ device, screen, lang, has }: Pick<ScreenProps, 'device' | 'screen' | 'lang' | 'has'>) {
  const ui = UI[lang]
  const loggedIn = screen === 'onboarding'

  if (device === 'phone') {
    const open = has('menuOpen')
    return (
      <div className="relative" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ backgroundColor: '#e8f4fd', borderBottom: '1px solid rgba(137,207,240,0.25)' }}>
          <div className="flex h-12 items-center justify-between px-4">
            <Image src="/logo.webp" alt="" width={240} height={60} className="h-8 w-auto" />
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1 px-2 text-[18px]">
                {ui.flag} <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </span>
              <span data-demo="nav-menu" className="rounded-lg p-2" style={{ color: '#94a3b8' }}>
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </span>
            </div>
          </div>
        </div>
        {open && (
          <div className="absolute inset-x-0 top-full" style={{ backgroundColor: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}>
            <div className="space-y-1 px-4 py-4">
              {ui.nav.map(l => (
                <div key={l} className="block rounded-lg px-4 py-3 text-sm font-semibold" style={{ color: '#475569' }}>
                  {l}
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} className="mt-4 space-y-2 pt-4">
                <div
                  data-demo="menu-register"
                  className="block w-full rounded-lg px-4 py-3 text-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #be185d, #ec4899)' }}
                >
                  {ui.register.toUpperCase()}
                </div>
                <div
                  className="block w-full rounded-lg px-4 py-3 text-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}
                >
                  {ui.login.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const border = 'rgba(137,207,240,0.35)'
  return (
    <div style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ backgroundColor: '#e8f4fd', borderBottom: '1px solid rgba(137,207,240,0.25)' }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <Image src="/logo.webp" alt="" width={240} height={60} className="h-12 w-auto" />
            <div className="flex h-16 items-stretch self-stretch" style={{ marginBottom: '-1px' }}>
              <span className="flex items-center gap-1.5 border-l px-5 text-xs font-semibold" style={{ color: '#475569', borderColor: border }}>
                {ui.flag} {ui.langCode} <ChevronDown className="h-3 w-3" />
              </span>
              {loggedIn ? (
                <>
                  <span className="flex items-center justify-center gap-2 border-l px-6 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #38bdf8, #89CFF0)', borderColor: border }}>
                    <User className="h-3.5 w-3.5" /> Sandra_ZH
                  </span>
                  <span className="flex items-center justify-center border-l px-6 text-xs font-semibold" style={{ color: '#475569', borderColor: border }}>
                    {ui.logout}
                  </span>
                </>
              ) : (
                <>
                  <span data-demo="nav-register" className="flex items-center justify-center border-l px-6 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #be185d, #ec4899)', borderColor: border }}>
                    {ui.register}
                  </span>
                  <span className="flex items-center justify-center border-l border-r px-6 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', borderColor: border }}>
                    {ui.login}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: 'linear-gradient(90deg, #ec4899, #f472b6)', boxShadow: '0 2px 8px rgba(236,72,153,0.15)' }}>
        <div className="flex items-center justify-center gap-1">
          {ui.nav.map(l => (
            <span key={l} className="px-5 py-2.5 text-[13px] font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Page bodies ───────────────────────── */

export function PageBody(props: ScreenProps) {
  if (props.screen === 'home') return <HomeBody device={props.device} lang={props.lang} />
  if (props.screen === 'onboarding') return <OnboardingBody device={props.device} lang={props.lang} />
  return <RegisterBody {...props} />
}

function HomeBody({ device, lang }: { device: Device; lang: Lang }) {
  const ui = UI[lang]
  const phone = device === 'phone'
  return (
    <div style={{ background: '#fce9f3' }} className="flex-1 pb-10">
      {/* Stories strip */}
      <div className="flex gap-3 overflow-hidden border-b border-sky-100 bg-[#e8f4fd] px-4 py-3" style={{ justifyContent: phone ? 'flex-start' : 'center' }}>
        {Array.from({ length: phone ? 6 : 14 }).map((_, i) => (
          <span key={i} className="flex flex-col items-center gap-1.5">
            <span
              className="flex items-center justify-center rounded-full bg-white/80"
              style={{ width: phone ? 56 : 70, height: phone ? 56 : 70, border: i === 0 ? '2px solid #ec4899' : '2px solid #e2e8f0' }}
            >
              <User className="text-gray-300" style={{ width: phone ? 18 : 22, height: phone ? 18 : 22 }} />
            </span>
            <span className="h-1.5 w-10 rounded bg-gray-200" />
          </span>
        ))}
      </div>

      <div className={phone ? 'px-2 pt-3' : 'mx-auto max-w-[1100px] px-4 pt-4'}>
        <div className={`rounded-xl bg-white/70 ${phone ? 'px-4 py-3' : 'px-5 py-4'}`}>
          <p className={`${phone ? 'text-xl' : 'text-2xl'} font-bold leading-tight text-gray-900`}>{ui.homeH1}</p>
        </div>

        <div className={`grid gap-2 py-3 ${phone ? 'grid-cols-1' : 'grid-cols-3 gap-3 pb-5'}`}>
          {[null, MapPin, Search].map((Icon, i) => (
            <div key={i} className="flex h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-400">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              <span className="flex-1 truncate">{ui.filters[i]}</span>
              {!Icon && <ChevronDown className="h-4 w-4" />}
            </div>
          ))}
        </div>

        <div className={`grid grid-cols-2 ${phone ? 'gap-2' : 'gap-4'}`}>
          {Array.from({ length: 6 }).map((_, i) =>
            phone ? (
              <div key={i} className="relative overflow-hidden rounded-[12px] bg-gradient-to-b from-pink-100 to-pink-200" style={{ aspectRatio: '3/4' }}>
                <div className="absolute inset-x-2 bottom-2 space-y-1">
                  <span className="block h-2.5 w-14 rounded bg-white/80" />
                  <span className="block h-2 w-20 rounded bg-white/60" />
                </div>
              </div>
            ) : (
              <div key={i} className="flex h-[280px] overflow-hidden rounded-[12px] bg-white shadow-sm">
                <div className="w-[36%] bg-gradient-to-b from-pink-100 to-pink-200" />
                <div className="flex-1 space-y-2.5 px-4 py-3.5">
                  <span className="block h-3.5 w-16 rounded-full bg-pink-100" />
                  <span className="block h-4 w-28 rounded bg-gray-200" />
                  <span className="block h-2.5 w-24 rounded bg-gray-100" />
                  <span className="block h-2.5 w-full rounded bg-gray-100" />
                  <span className="block h-2.5 w-11/12 rounded bg-gray-100" />
                  <span className="block h-2.5 w-4/5 rounded bg-gray-100" />
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}

function RegisterBody({ device, lang, has, text, focus }: ScreenProps) {
  const ui = UI[lang]
  const phone = device === 'phone'
  const field = (t: Target) =>
    `w-full px-3 py-2 text-sm border-2 rounded-lg bg-gray-50 transition-all ${
      focus === t ? 'border-pink-500 ring-1 ring-pink-200' : 'border-gray-200'
    }`
  const caret = (t: Target) =>
    focus === t ? <span className="ml-px inline-block h-[17px] w-[1.5px] animate-pulse bg-gray-900 align-middle" /> : null
  const value = (t: Target, placeholder: string) => {
    const v = text(t)
    if (!v) return <span className="text-gray-400">{placeholder}</span>
    const shown = SECRET.includes(t) ? '•'.repeat(v.length) : v
    return <span className={SECRET.includes(t) ? 'tracking-[0.18em] text-gray-900' : 'text-gray-900'}>{shown}</span>
  }
  const label = (children: React.ReactNode, required = true) => (
    <span className="mb-1 block text-xs font-bold text-gray-700">
      {children}
      {required && <span className="text-pink-600">*</span>}
    </span>
  )
  const checkbox = (t: Target | null, on: boolean, children: React.ReactNode) => (
    <div className="flex items-start gap-2">
      <span
        data-demo={t ?? undefined}
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center"
        style={{
          borderRadius: phone ? 4 : 3,
          border: on ? 'none' : `1px solid ${phone ? '#c7c7cc' : '#767676'}`,
          background: on ? (phone ? '#007aff' : '#0075ff') : '#ffffff',
        }}
      >
        {on && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
      </span>
      <span className="text-xs leading-tight text-gray-700">{children}</span>
    </div>
  )
  const submitting = has('submitting')

  return (
    <div className={`flex-1 bg-gray-50 ${phone ? 'px-3 py-4' : 'px-4 py-6'}`}>
      <div className="mx-auto max-w-4xl">
        {/* Tabs */}
        <div className={`flex justify-center ${phone ? 'mb-4' : 'mb-6'}`}>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <span className={`py-2 text-sm font-semibold text-gray-500 ${phone ? 'px-4' : 'px-6'}`}>{ui.signInTab}</span>
            <span className={`rounded-md bg-brand py-2 text-sm font-bold text-white shadow-sm ${phone ? 'px-4' : 'px-6'}`}>{ui.register}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className={`grid ${phone ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {/* Left column */}
            <div className={`flex flex-col justify-between bg-[#1f2126] ${phone ? 'p-5' : 'p-8'}`}>
              <div>
                <p className={`mb-1 font-bold text-white ${phone ? 'text-xl' : 'text-2xl'}`}>{ui.leftHeading}</p>
                <p className={`text-sm text-gray-400 ${phone ? 'mb-5' : 'mb-8'}`}>{ui.leftSubtitle}</p>
                <div className={phone ? 'space-y-3' : 'space-y-4'}>
                  {ui.bullets.map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
                      <span className="text-sm text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`space-y-2 border-t border-gray-700 ${phone ? 'mt-6 pt-4' : 'mt-10 pt-6'}`}>
                <span className="mb-2 inline-flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-200">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-brand">
                    <span className="ml-px h-0 w-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-brand" />
                  </span>
                  {ui.guideLink}
                </span>
                <p className="text-xs text-gray-500">
                  {ui.haveAccount} <span className="font-semibold text-brand">{ui.signInHere}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {ui.modelAgency} <span className="font-semibold text-brand">{ui.modelAgencyLink}</span>
                </p>
              </div>
            </div>

            {/* Registration form */}
            <div className={phone ? 'p-5' : 'p-8'}>
              <div className="space-y-3">
                <p className="mb-3 text-center text-lg font-bold text-gray-900">{ui.formTitle}</p>

                <div className="relative">
                  {label(ui.userType)}
                  <div data-demo="type" className={`${field('type')} flex items-center justify-between text-gray-700`}>
                    <span>{has('typeChosen') ? ui.typeOptions[2] : ui.typeOptions[0]}</span>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </div>
                  {has('typeOpen') && <TypeMenu device={device} options={ui.typeOptions} />}
                </div>

                <div>
                  {label(ui.username)}
                  <div data-demo="username" className={field('username')}>
                    {value('username', ui.username)}
                    {caret('username')}
                  </div>
                </div>

                <div>
                  {label(ui.email)}
                  <div data-demo="email" className={field('email')}>
                    {value('email', 'name@domain.com')}
                    {caret('email')}
                  </div>
                </div>

                <div>
                  {label(ui.phone)}
                  <div className="flex w-full items-stretch">
                    <span className={`flex shrink-0 items-center gap-1 rounded-l-lg border-2 border-r-0 border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 ${phone ? 'px-2' : 'px-3'}`}>
                      🇨🇭 +41 <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                    </span>
                    <div
                      data-demo="phone"
                      className={`min-w-0 flex-1 rounded-r-lg border-2 bg-gray-50 px-3 py-2 text-sm ${
                        focus === 'phone' ? 'border-pink-500 ring-1 ring-pink-200' : 'border-gray-200'
                      }`}
                    >
                      {value('phone', '79 123 45 67')}
                      {caret('phone')}
                    </div>
                  </div>
                </div>

                <div>
                  {label(<>{ui.dob}<span className="ml-1 font-normal text-gray-400">{ui.dobHint}</span></>, false)}
                  <div data-demo="dob" className={field('dob')}>
                    {value('dob', 'DD.MM.YYYY')}
                    {caret('dob')}
                  </div>
                </div>

                {(['password', 'confirm'] as const).map(t => (
                  <div key={t}>
                    {label(t === 'password' ? ui.password : ui.confirm)}
                    <div className="relative">
                      <div data-demo={t} className={`${field(t)} pr-10`}>
                        {value(t, '••••••••••')}
                        {caret(t)}
                      </div>
                      <Eye className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>
                ))}

                <div className="space-y-2 pt-2">
                  {checkbox('terms', has('terms'), <>{ui.acceptPre} <span className="font-semibold text-pink-600 underline">{ui.terms}</span></>)}
                  {checkbox('privacy', has('privacy'), <>{ui.acceptPre} <span className="font-semibold text-pink-600 underline">{ui.privacy}</span></>)}
                  {checkbox(null, false, ui.newsletter)}
                </div>

                <div
                  data-demo="submit"
                  className={`w-full rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 py-3 text-center text-sm font-bold text-white ${
                    submitting ? 'opacity-50' : 'shadow-lg shadow-pink-500/30'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {ui.submitting}
                    </span>
                  ) : (
                    ui.register
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** The <select> popup: a macOS menu in Chrome on the laptop, the iOS popover on the phone. */
function TypeMenu({ device, options }: { device: Device; options: readonly string[] }) {
  if (device === 'phone') {
    return (
      <div className="absolute left-0 top-full z-20 mt-1.5 w-[250px] overflow-hidden rounded-[13px] bg-white/95 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
        {options.map((o, i) => (
          <div
            key={o}
            data-demo={i === 2 ? 'type-model' : undefined}
            className={`flex h-[44px] items-center gap-2 px-4 text-[17px] ${i < options.length - 1 ? 'border-b border-black/10' : ''} ${i === 0 ? 'text-gray-400' : 'text-black'}`}
          >
            <span className="w-4">{i === 0 && <Check className="h-4 w-4 text-black" strokeWidth={2.5} />}</span>
            {o}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="absolute inset-x-0 top-[22px] z-20 rounded-[6px] border border-black/10 bg-[#f6f6f6]/95 py-[5px] text-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur">
      {options.map((o, i) => (
        <div
          key={o}
          data-demo={i === 2 ? 'type-model' : undefined}
          className={`relative mx-[5px] flex h-[22px] items-center rounded-[4px] pl-[22px] ${i === 2 ? 'bg-[#0a63d6] text-white' : i === 0 ? 'text-gray-500' : 'text-gray-900'}`}
        >
          {i === 0 && <Check className="absolute left-[6px] h-3 w-3" strokeWidth={3} />}
          {o}
        </div>
      ))}
    </div>
  )
}

function OnboardingBody({ device, lang }: { device: Device; lang: Lang }) {
  const ui = UI[lang]
  const phone = device === 'phone'
  const input = 'w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg bg-gray-50'
  const [pre, model, mid, club, post] = ui.obSubtitle
  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 via-pink-50 to-purple-50 px-4 pb-10 pt-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 text-center">
          <p className={`mb-1 font-black tracking-tight text-gray-900 ${phone ? 'text-2xl' : 'text-3xl'}`}>
            {ui.welcome}<span className="text-pink-600">nicemodels.ch</span>
          </p>
          <p className={`mx-auto max-w-2xl text-gray-600 ${phone ? 'text-xs' : 'text-sm'}`}>
            {pre}<span className="font-semibold">{model}</span>{mid}<span className="font-semibold">{club}</span>{post}
          </p>
        </div>
        <div className={`rounded-2xl bg-white/90 shadow-2xl ${phone ? 'px-4 py-4' : 'px-8 py-5'}`}>
          <div className="mx-auto max-w-3xl space-y-3">
            <p className="text-xl font-bold text-gray-900">{ui.obTitle}</p>
            <div className={`grid gap-3 ${phone ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {ui.obFields.map(f => (
                <div key={f.label}>
                  <span className="mb-1 block text-xs font-bold text-gray-700">
                    {f.label} <span className="text-pink-600">*</span>
                  </span>
                  <div className={`${input} flex items-center justify-between text-gray-400`}>
                    {f.ph}
                    {f.select && <ChevronDown className="h-4 w-4 text-gray-600" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── iOS keyboard ───────────────────────── */

const KEY_SHADOW = '0 1px 0 rgba(0,0,0,0.3)'

export function Keyboard({ layout, pressed, lang }: { layout: KbLayout; pressed: string | null; lang: Lang }) {
  const ui = UI[lang]
  const key = (id: string, label: React.ReactNode, opts: { w?: number; dark?: boolean; small?: boolean } = {}) => {
    const down = pressed === id
    return (
      <span
        key={id}
        className={`flex h-[42px] items-center justify-center rounded-[5px] ${opts.small ? 'text-[16px]' : 'text-[22px]'} text-black ${opts.w ? 'shrink-0' : 'flex-1'}`}
        style={{
          width: opts.w,
          background: down ? '#a6abb6' : opts.dark ? '#abb0bc' : '#ffffff',
          boxShadow: KEY_SHADOW,
          transform: down ? 'translateY(1px)' : undefined,
        }}
      >
        {label}
      </span>
    )
  }

  if (layout === 'numeric') {
    const pad: [string, string][] = [
      ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
      ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
      ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
    ]
    return (
      <div className="bg-[#d1d4db] px-[6px] pb-[40px] pt-[8px]" style={{ height: KB_HEIGHT.numeric }}>
        <div className="grid grid-cols-3 gap-[7px]">
          {pad.map(([d, letters]) => (
            <span
              key={d}
              className="flex h-[46px] flex-col items-center justify-center rounded-[5px] leading-none text-black"
              style={{ background: pressed === d ? '#a6abb6' : '#ffffff', boxShadow: KEY_SHADOW }}
            >
              <span className="text-[25px]">{d}</span>
              <span className="mt-0.5 text-[9px] font-semibold tracking-[0.15em]">{letters}</span>
            </span>
          ))}
          <span className="flex h-[46px] items-center justify-center text-[17px] text-black">+*#</span>
          <span
            className="flex h-[46px] items-center justify-center rounded-[5px] text-[25px] text-black"
            style={{ background: pressed === '0' ? '#a6abb6' : '#ffffff', boxShadow: KEY_SHADOW }}
          >
            0
          </span>
          <span className="flex h-[46px] items-center justify-center text-black">
            <Delete className="h-6 w-6" strokeWidth={1.5} />
          </span>
        </div>
      </div>
    )
  }

  const [row1, row2, row3] = ui.kbRows
  // The English middle row has one key fewer and sits indented by half a key.
  const indent = row2.length < row1.length ? 'px-[18px]' : ''
  return (
    <div className="bg-[#d1d4db] px-[3px] pb-[34px]" style={{ height: KB_HEIGHT[layout] }}>
      {/* QuickType bar */}
      <div className="flex h-[44px] items-center justify-around text-[15px] text-gray-700">
        <span>{ui.quickType[0]}</span>
        <span className="h-5 w-px bg-gray-400/60" />
        <span>{ui.quickType[1]}</span>
        <span className="h-5 w-px bg-gray-400/60" />
        <span>{ui.quickType[2]}</span>
      </div>
      <div className="space-y-[11px]">
        <div className="flex gap-[5px]">{row1.split('').map(c => key(c, c))}</div>
        <div className={`flex gap-[5px] ${indent}`}>{row2.split('').map(c => key(c, c))}</div>
        <div className="flex gap-[5px]">
          {key('shift', '⇧', { w: 42, dark: true })}
          <span className="mx-[7px] flex flex-1 gap-[5px]">{row3.split('').map(c => key(c, c))}</span>
          {key('back', <Delete className="h-5 w-5" strokeWidth={1.5} />, { w: 42, dark: true })}
        </div>
        <div className="flex gap-[5px]">
          {key('123', '123', { w: 44, dark: true, small: true })}
          {key('globe', <Globe className="h-5 w-5" strokeWidth={1.5} />, { w: 42, dark: true })}
          {key('space', layout === 'email' ? '' : ui.kbSpace, { small: true })}
          {layout === 'email' && key('@', '@', { w: 36, small: true })}
          {layout === 'email' && key('.', '.', { w: 36, small: true })}
          {key('return', ui.kbReturn, { w: 88, dark: true, small: true })}
        </div>
      </div>
    </div>
  )
}

/** The key that lights up while a character is typed (null for keys not on the layer shown). */
export function keyFor(ch: string): string | null {
  if (ch === ' ') return 'space'
  if (ch === '@' || ch === '.') return ch
  const lower = ch.toLowerCase()
  return /^[a-zäöü0-9]$/.test(lower) ? lower : null
}
