'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronLeft, ChevronRight, Laptop, Pause, Play, RotateCcw, Smartphone } from 'lucide-react'
import {
  BrowserChrome,
  DEVICE,
  KB_HEIGHT,
  Keyboard,
  PageBody,
  SiteHeader,
  keyFor,
  tabTitle,
  type Device,
  type Flag,
  type KbLayout,
  type Lang,
  type Screen,
  type Target,
} from './SignupDemoScreens'

/**
 * Animated walkthrough of the signup, played on a copy of the real pages inside
 * a laptop or phone frame. The copy is laid out at true device resolution and
 * scaled to fit, so it looks exactly like the site does on that device; the
 * laptop gets a mouse pointer, the phone gets taps, the iOS keyboard and the
 * hamburger menu.
 *
 * Every step is a list of beats (click / type). The state before any step is
 * all earlier beats replayed instantly, so jumping, going back, restarting or
 * switching device always lands on a consistent form.
 */

type Beat =
  | { at: Target; click: true; set?: Flag[]; unset?: Flag[]; reserve?: number }
  | { at: Target; type: string | Record<Lang, string>; kb: KbLayout }

type Copy = string | Record<Device, string>

interface DemoStep {
  title: Record<Lang, string>
  text: Record<Lang, Copy>
  beats: Beat[] | Record<Device, Beat[]>
}

const STEPS: DemoStep[] = [
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

/** Labels of the player controls. */
const CONTROLS = {
  de: {
    back: 'Zurück', next: 'Weiter', play: 'Abspielen', pause: 'Pause', again: 'Nochmals', restart: 'Von vorne beginnen',
    device: 'Gerät wählen', laptop: 'Laptop', phone: 'Handy', steps: 'Schritte der Anleitung',
    step: (i: number, n: number) => `Schritt ${i} von ${n}`,
  },
  en: {
    back: 'Back', next: 'Next', play: 'Play', pause: 'Pause', again: 'Replay', restart: 'Start over',
    device: 'Choose device', laptop: 'Laptop', phone: 'Phone', steps: 'Steps of the guide',
    step: (i: number, n: number) => `Step ${i} of ${n}`,
  },
} as const

const LAST = STEPS.length - 1

const beatsOf = (s: DemoStep, d: Device) => (Array.isArray(s.beats) ? s.beats : s.beats[d])
const textOf = (s: DemoStep, d: Device, lang: Lang) => {
  const t = s.text[lang]
  return typeof t === 'string' ? t : t[d]
}
const typedOf = (b: Extract<Beat, { type: unknown }>, lang: Lang) => (typeof b.type === 'string' ? b.type : b.type[lang])

interface DemoState {
  flags: Flag[]
  texts: Partial<Record<Target, string>>
}

const EMPTY: DemoState = { flags: [], texts: {} }

function applyBeat(s: DemoState, b: Beat, lang: Lang): DemoState {
  if ('type' in b) return { ...s, texts: { ...s.texts, [b.at]: typedOf(b, lang) } }
  const flags = s.flags.filter(f => !b.unset?.includes(f))
  for (const f of b.set ?? []) if (!flags.includes(f)) flags.push(f)
  return { ...s, flags }
}

function stateBefore(step: number, device: Device, lang: Lang): DemoState {
  return STEPS.slice(0, step)
    .flatMap(s => beatsOf(s, device))
    .reduce((s, b) => applyBeat(s, b, lang), EMPTY)
}

function screenFor(step: number, s: DemoState): Screen {
  if (step === LAST) return 'onboarding'
  return s.flags.includes('registerOpen') ? 'register' : 'home'
}

/** Reading time for a caption before auto-advancing. */
const holdMs = (text: string) => Math.max(2200, text.length * 38)

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'
const NARROW_QUERY = '(max-width: 767px)'

function mediaStore(query: string) {
  return {
    subscribe(onChange: () => void) {
      const mq = window.matchMedia?.(query)
      mq?.addEventListener?.('change', onChange)
      return () => mq?.removeEventListener?.('change', onChange)
    },
    get: () => window.matchMedia?.(query).matches ?? false,
    server: () => false,
  }
}
const reduceStore = mediaStore(REDUCE_QUERY)
const narrowStore = mediaStore(NARROW_QUERY)

const viewportHeightStore = {
  subscribe(onChange: () => void) {
    window.addEventListener('resize', onChange)
    return () => window.removeEventListener('resize', onChange)
  },
  get: () => window.innerHeight,
  server: () => 900,
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export default function SignupDemo({ lang = 'de' }: { lang?: Lang }) {
  const c = CONTROLS[lang]
  const rootRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const reduceMotion = useSyncExternalStore(reduceStore.subscribe, reduceStore.get, reduceStore.server)
  const narrow = useSyncExternalStore(narrowStore.subscribe, narrowStore.get, narrowStore.server)
  const windowH = useSyncExternalStore(viewportHeightStore.subscribe, viewportHeightStore.get, viewportHeightStore.server)
  const [deviceChoice, setDeviceChoice] = useState<Device | null>(null)
  const device: Device = deviceChoice ?? (narrow ? 'phone' : 'laptop')
  const spec = DEVICE[device]

  const [avail, setAvail] = useState(900)
  const [step, setStep] = useState(0)
  const [state, setState] = useState<DemoState>(EMPTY)
  const [focus, setFocus] = useState<Target | null>(null)
  const [keyboard, setKeyboard] = useState<KbLayout | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)
  const [scroll, setScroll] = useState(0)
  const [pointer, setPointer] = useState({ x: 640, y: 640 })
  const [clicking, setClicking] = useState(false)
  const [tap, setTap] = useState<{ x: number; y: number; id: number } | null>(null)
  const [stepDone, setStepDone] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [run, setRun] = useState(0)

  // Refs mirror what the async animation reads mid-flight.
  const scrollRef = useRef(0)
  const keyboardRef = useRef<KbLayout | null>(null)
  const screenRef = useRef<Screen>('home')

  // Size the device to the space available.
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => setAvail(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Fit the device to the width, and to the window height minus the site header
  // and the caption below it, so device and caption are on screen together.
  const bezel = device === 'laptop' ? 10 : 11
  const maxDeviceH = Math.max(380, windowH - (narrow ? 49 : 105) - (narrow ? 252 : 262))
  let frameW: number
  if (device === 'laptop') {
    const chromeH = bezel * 2 + 4 + 14 // bezel, camera strip, base
    frameW = Math.min(Math.min(avail, 900) / 1.12, ((maxDeviceH - chromeH) * spec.w) / spec.h + bezel * 2)
  } else {
    frameW = Math.min(avail < 640 ? Math.min(300, avail * 0.82) : 330, ((maxDeviceH - bezel * 2) * spec.w) / spec.h + bezel * 2)
  }
  const scale = (frameW - bezel * 2) / spec.w
  const scaleRef = useRef(scale)
  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  // Start playing the first time the demo is mostly on screen.
  useEffect(() => {
    const el = rootRef.current
    if (!el || started || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setStarted(true)
          if (!window.matchMedia?.(REDUCE_QUERY).matches) setPlaying(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [started])

  // Animate the beats of the current step.
  useEffect(() => {
    if (!started) return
    let cancelled = false
    const dev = DEVICE[device]

    const find = (t: Target) => canvasRef.current?.querySelector<HTMLElement>(`[data-demo="${t}"]`) ?? null

    /** Element box in page-content coordinates (device px), independent of the current scroll. */
    const contentBox = (el: HTMLElement) => {
      const s = scaleRef.current
      const r = el.getBoundingClientRect()
      const c = contentRef.current!.getBoundingClientRect()
      return { y: (r.top - c.top) / s, h: r.height / s }
    }
    const inContent = (el: HTMLElement) => !!el.closest('[data-layer="content"]')

    const setScrollTo = (y: number) => {
      scrollRef.current = y
      setScroll(y)
    }

    /** Scroll the page so the target sits clear of the header and of anything covering the bottom. */
    const ensureVisible = (t: Target, reserve: number) => {
      const el = find(t)
      if (!el || !inContent(el) || !contentRef.current) return false
      const { y, h } = contentBox(el)
      const vh = dev.h - dev.chrome
      const top = dev.header + 16
      const bottom = vh - reserve - 16
      const cur = scrollRef.current
      if (y - cur >= top && y + h - cur <= bottom) return false
      const max = Math.max(0, contentRef.current.offsetHeight + reserve - vh)
      const next = Math.round(Math.min(max, Math.max(0, y - top - (bottom - top - h) * 0.35)))
      if (next === cur) return false
      setScrollTo(next)
      return true
    }

    /** Where to put the pointer / tap for a target, in canvas coordinates (device px). */
    const pointFor = (t: Target) => {
      const el = find(t)
      const canvas = canvasRef.current
      if (!el || !canvas) return null
      const s = scaleRef.current
      const r = el.getBoundingClientRect()
      const cv = canvas.getBoundingClientRect()
      const w = r.width / s
      const x = (r.left - cv.left) / s + (w < 40 ? w / 2 : Math.min(w * 0.6, w - 14))
      if (!inContent(el)) return { x, y: (r.top - cv.top) / s + (r.height / s) * 0.55 }
      const { y, h } = contentBox(el)
      return { x, y: dev.chrome + y - scrollRef.current + h * 0.55 }
    }

    const showKeyboard = (k: KbLayout | null) => {
      keyboardRef.current = k
      setKeyboard(k)
      // Like iOS: once the keyboard is gone, the page cannot stay scrolled past its end.
      if (!k && contentRef.current) {
        const max = Math.max(0, contentRef.current.offsetHeight - (dev.h - dev.chrome))
        if (scrollRef.current > max) setScrollTo(max)
      }
    }

    const animate = async () => {
      const beats = beatsOf(STEPS[step], device)
      let s = stateBefore(step, device, lang)
      setState(s)
      setFocus(null)
      setPressed(null)
      setStepDone(false)

      const screen = screenFor(step, s)
      if (screen !== screenRef.current) {
        screenRef.current = screen
        setScrollTo(0)
      }
      if (!(beats[0] && 'type' in beats[0])) showKeyboard(null)

      if (reduceMotion) {
        s = stateBefore(step + 1, device, lang)
        setState(s)
        const last = beats[beats.length - 1]
        await sleep(50)
        if (cancelled) return
        if (last) ensureVisible(last.at, 0)
        setStepDone(true)
        return
      }

      await sleep(300)
      for (const beat of beats) {
        if (cancelled) return
        const typing = 'type' in beat
        const reserve = typing ? (device === 'phone' ? KB_HEIGHT[beat.kb] : 0) : beat.reserve ?? 0
        if (ensureVisible(beat.at, reserve)) await sleep(520)
        if (cancelled) return
        const p = pointFor(beat.at)
        if (!p) continue

        if (device === 'laptop') {
          setPointer(p)
          await sleep(650)
          if (cancelled) return
          setClicking(true)
          await sleep(150)
          setClicking(false)
        } else {
          setTap({ ...p, id: Date.now() })
          await sleep(160)
        }
        if (cancelled) return

        if (typing) {
          setFocus(beat.at)
          if (device === 'phone' && keyboardRef.current !== beat.kb) {
            showKeyboard(beat.kb)
            await sleep(320)
          }
          const value = typedOf(beat, lang)
          for (let i = 1; i <= value.length; i++) {
            if (cancelled) return
            setPressed(device === 'phone' ? keyFor(value[i - 1]) : null)
            setState({ ...s, texts: { ...s.texts, [beat.at]: value.slice(0, i) } })
            await sleep(80)
          }
          setPressed(null)
        } else {
          setFocus(null)
          if (keyboardRef.current) showKeyboard(null)
        }
        s = applyBeat(s, beat, lang)
        setState(s)
        if (screenFor(step, s) !== screenRef.current) {
          screenRef.current = screenFor(step, s)
          setScrollTo(0)
        }
        // Leave an opened menu on screen long enough to see what gets picked.
        const opened = !typing && beat.set?.some(f => f === 'menuOpen' || f === 'typeOpen')
        await sleep(opened ? 900 : 320)
      }
      if (!cancelled) setStepDone(true)
    }

    animate()
    return () => {
      cancelled = true
    }
  }, [step, run, started, reduceMotion, device, lang])

  // Playback stops by itself once the last step has played out.
  const isPlaying = playing && !(step === LAST && stepDone)

  // Auto-advance once a step has played out and been on screen long enough to read.
  useEffect(() => {
    if (!isPlaying || !stepDone) return
    const id = setTimeout(() => setStep(s => s + 1), holdMs(textOf(STEPS[step], device, lang)))
    return () => clearTimeout(id)
  }, [isPlaying, stepDone, step, device, lang])

  const goTo = (i: number) => {
    setStarted(true)
    // After the demo has ended, stepping around should not quietly resume it.
    setPlaying(isPlaying)
    setStep(Math.max(0, Math.min(LAST, i)))
    setRun(r => r + 1)
  }

  const restart = () => {
    goTo(0)
    setPlaying(!reduceMotion)
  }

  const togglePlay = () => {
    setStarted(true)
    if (step === LAST && stepDone) {
      restart()
      return
    }
    setPlaying(!isPlaying)
  }

  const switchDevice = (d: Device) => {
    if (d === device) return
    setDeviceChoice(d)
    setPointer({ x: DEVICE[d].w / 2, y: DEVICE[d].h * 0.8 })
    scrollRef.current = 0
    setScroll(0)
    keyboardRef.current = null
    setKeyboard(null)
    setRun(r => r + 1)
  }

  const has = (f: Flag) => state.flags.includes(f)
  const text = (t: Target) => state.texts[t] ?? ''
  const screen = screenFor(step, state)
  const url = screen === 'home' ? 'nicemodels.ch' : `nicemodels.ch/${screen}`
  const title = tabTitle(lang, screen)
  const viewportH = spec.h - spec.chrome
  const current = STEPS[step]
  const ease = reduceMotion ? 'none' : undefined

  const screenBox = { width: spec.w * scale, height: spec.h * scale }

  const canvas = (
    <div
      ref={canvasRef}
      className="absolute left-0 top-0 overflow-hidden bg-white"
      style={{ width: spec.w, height: spec.h, transform: `scale(${scale})`, transformOrigin: '0 0' }}
    >
      <BrowserChrome device={device} url={url} title={title} />

      {/* Page viewport */}
      <div className="absolute inset-x-0 overflow-hidden" style={{ top: spec.chrome, height: viewportH }}>
        <div
          ref={contentRef}
          data-layer="content"
          className="absolute inset-x-0 top-0"
          style={{
            minHeight: viewportH,
            paddingTop: spec.header,
            transform: `translateY(${-scroll}px)`,
            transition: ease ?? 'transform 500ms cubic-bezier(.4,0,.2,1)',
          }}
        >
          <div
            key={screen}
            className="flex flex-col"
            style={{ minHeight: viewportH - spec.header, animation: reduceMotion ? undefined : 'nmDemoFade 300ms ease-out' }}
          >
            <PageBody device={device} screen={screen} lang={lang} has={has} text={text} focus={focus} />
          </div>
        </div>
        {/* Solid backing and a 1px overlap hide sub-pixel seams that scaling opens between the header bars. */}
        <div className="absolute inset-x-0 z-10" style={{ top: -1, paddingTop: 1, background: '#e8f4fd', transform: 'translateZ(0)' }}>
          <SiteHeader device={device} screen={screen} lang={lang} has={has} />
        </div>
      </div>

      {/* iOS keyboard */}
      {device === 'phone' && (
        <div
          className="absolute inset-x-0 bottom-0 z-30"
          style={{
            transform: keyboard ? 'translateY(0)' : 'translateY(100%)',
            transition: ease ?? 'transform 280ms cubic-bezier(.2,.8,.2,1)',
          }}
        >
          <Keyboard layout={keyboard ?? 'text'} pressed={pressed} lang={lang} />
        </div>
      )}
      {device === 'phone' && (
        <span className="absolute bottom-[8px] left-1/2 z-40 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black/85" />
      )}

      {/* Finger tap */}
      {device === 'phone' && tap && (
        <span
          key={tap.id}
          className="pointer-events-none absolute z-50 h-[46px] w-[46px] rounded-full bg-black/25"
          style={{ left: tap.x, top: tap.y, animation: reduceMotion ? undefined : 'nmDemoTap 520ms ease-out forwards', opacity: reduceMotion ? 0 : undefined }}
        />
      )}

      {/* Mouse pointer */}
      {device === 'laptop' && screen !== 'onboarding' && (
        <div
          className="pointer-events-none absolute left-0 top-0 z-50"
          style={{
            transform: `translate(${pointer.x}px, ${pointer.y}px) scale(${1 / scale})`,
            transformOrigin: '0 0',
            transition: ease ?? 'transform 650ms cubic-bezier(.4,0,.2,1)',
          }}
        >
          {clicking && <span className="absolute -left-3 -top-3 h-6 w-6 animate-ping rounded-full bg-pink-400/60" />}
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ marginLeft: -4, marginTop: -2, transform: clicking ? 'scale(0.85)' : undefined }}>
            <path d="M4 2l16 10-7 1.5L9.5 21z" fill="#111827" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )

  return (
    <div ref={rootRef} className="rounded-2xl border border-gray-200 bg-gradient-to-b from-pink-50/70 to-white p-3 sm:p-4">
      <style>{`
        @keyframes nmDemoTap { 0% { transform: translate(-50%,-50%) scale(.45); opacity: .55 } 100% { transform: translate(-50%,-50%) scale(1.15); opacity: 0 } }
        @keyframes nmDemoFade { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      {/* Device */}
      <div ref={wrapRef} aria-hidden="true" className="flex select-none justify-center">
        {device === 'laptop' ? (
          <div style={{ width: frameW }}>
            <div className="relative rounded-t-[18px] bg-[#16181d] shadow-xl" style={{ padding: bezel, paddingTop: bezel + 4 }}>
              <span className="absolute left-1/2 top-[5px] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#3a3d44]" />
              <div className="relative overflow-hidden rounded-[3px]" style={screenBox}>
                {canvas}
              </div>
            </div>
            <div
              className="relative h-[14px] rounded-b-[12px] bg-gradient-to-b from-[#d9dbe0] to-[#a5a9b1] shadow-md"
              style={{ width: '112%', marginLeft: '-6%' }}
            >
              <span className="absolute left-1/2 top-0 h-[6px] w-[14%] -translate-x-1/2 rounded-b-md bg-[#9a9ea6]" />
            </div>
          </div>
        ) : (
          <div className="relative rounded-[48px] bg-[#16181d] shadow-xl" style={{ width: frameW, padding: bezel }}>
            <span className="absolute -left-[3px] top-[110px] h-[30px] w-[3px] rounded-l bg-[#2a2d33]" />
            <span className="absolute -left-[3px] top-[160px] h-[54px] w-[3px] rounded-l bg-[#2a2d33]" />
            <span className="absolute -right-[3px] top-[140px] h-[80px] w-[3px] rounded-r bg-[#2a2d33]" />
            <div className="relative overflow-hidden rounded-[38px]" style={screenBox}>
              {canvas}
            </div>
          </div>
        )}
      </div>

      {/* Caption + controls */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 sm:px-5 sm:py-4">
        <div className="mb-3 flex gap-1" role="group" aria-label={c.steps}>
          {STEPS.map((s, i) => (
            <button
              key={s.title.de}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${c.step(i + 1, STEPS.length)}: ${s.title[lang]}`}
              aria-current={i === step ? 'step' : undefined}
              className="group flex-1 py-1.5"
            >
              <span
                className={`block h-1.5 rounded-full transition-colors ${
                  i < step ? 'bg-pink-400' : i === step ? 'bg-pink-600' : 'bg-gray-200 group-hover:bg-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <div aria-live="polite" className="min-h-[96px] sm:min-h-[84px]">
          <p className="hidden text-[11px] font-bold uppercase tracking-wider text-pink-600 sm:block">
            {c.step(step + 1, STEPS.length)}
          </p>
          <p className="mt-0.5 text-base font-bold text-gray-900">{current.title[lang]}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-gray-600 sm:text-sm">{textOf(current, device, lang)}</p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
            aria-label={c.back}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">{c.back}</span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-1.5 rounded-lg bg-pink-600 px-3 py-2 text-xs font-bold text-white hover:bg-pink-700 sm:px-4"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? c.pause : step === LAST && stepDone ? c.again : c.play}
            </button>
            <button
              type="button"
              onClick={restart}
              aria-label={c.restart}
              title={c.restart}
              className="hidden rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 sm:inline-flex"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs font-semibold" role="group" aria-label={c.device}>
              {([
                { d: 'laptop' as Device, label: c.laptop, Icon: Laptop },
                { d: 'phone' as Device, label: c.phone, Icon: Smartphone },
              ]).map(({ d, label, Icon }) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => switchDevice(d)}
                  aria-pressed={device === d}
                  aria-label={label}
                  title={label}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors sm:px-3 ${
                    device === d ? 'bg-pink-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => goTo(step + 1)}
            disabled={step === LAST}
            aria-label={c.next}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 sm:px-3"
          >
            <span className="hidden sm:inline">{c.next}</span> <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
