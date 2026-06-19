'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { driver, type Driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useAuth } from '@/components/auth/AuthProvider'
import { TOUR_ROUTES, TOUR_STEPS, type TourName, type TourStepDef } from './tourSteps'

interface TutorialContextValue {
  startTour: (tour: TourName) => void
  endTour: () => void
}

const TutorialContext = createContext<TutorialContextValue>({
  startTour: () => {},
  endTour: () => {},
})

export function useTutorial() {
  return useContext(TutorialContext)
}

const STORAGE_KEY = 'nm_tutorial'
const DONE_KEY = 'nm_tutorial_done'

interface PersistedState {
  tour: TourName
  routeIndex: number
  auto: boolean
}

type Outcome = 'pending' | 'complete' | 'cancel' | 'teardown'

function readState(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedState) : null
  } catch {
    return null
  }
}

function writeState(state: PersistedState | null) {
  try {
    if (state) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // sessionStorage unavailable — tour just won't survive navigation
  }
}

function waitForElement(selector: string, timeout: number): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector)
    if (existing) return resolve(existing)
    const start = Date.now()
    const interval = setInterval(() => {
      const el = document.querySelector(selector)
      if (el || Date.now() - start > timeout) {
        clearInterval(interval)
        resolve(el)
      }
    }, 120)
  })
}

export default function TutorialProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('dashboard.model.tutorial')
  const { profile, refreshProfile } = useAuth()

  const driverRef = useRef<Driver | null>(null)
  const outcomeRef = useRef<Outcome>('pending')
  const startingRef = useRef(false)
  const [tick, setTick] = useState(0)

  const markComplete = useCallback(() => {
    try {
      localStorage.setItem(DONE_KEY, '1')
    } catch {
      // ignore
    }
    fetch('/api/tutorial/complete', { method: 'POST' })
      .then(() => refreshProfile())
      .catch(() => {})
  }, [refreshProfile])

  const startTour = useCallback(
    (tour: TourName, auto = false) => {
      writeState({ tour, routeIndex: 0, auto })
      const firstRoute = TOUR_ROUTES[tour][0]
      if (pathname === firstRoute) {
        setTick((x) => x + 1)
      } else {
        router.push(firstRoute)
      }
    },
    [pathname, router],
  )

  const endTour = useCallback(() => {
    outcomeRef.current = 'teardown'
    writeState(null)
    driverRef.current?.destroy()
    driverRef.current = null
  }, [])

  // Resume / run the segment for the current route whenever we land on it.
  useEffect(() => {
    const state = readState()
    if (!state) return
    const routes = TOUR_ROUTES[state.tour]
    const expected = routes[state.routeIndex]
    if (!expected) {
      writeState(null)
      return
    }
    if (pathname !== expected) return
    if (driverRef.current?.isActive() || startingRef.current) return

    const routes_len = routes.length
    const isLastSegment = state.routeIndex >= routes_len - 1
    const segmentDefs = TOUR_STEPS[state.tour].filter((s) => s.route === expected)

    const advanceOrFinish = () => {
      if (state.routeIndex < routes_len - 1) {
        const next: PersistedState = { ...state, routeIndex: state.routeIndex + 1 }
        writeState(next)
        router.push(routes[next.routeIndex])
        setTick((x) => x + 1)
      } else {
        if (state.auto) markComplete()
        writeState(null)
      }
    }

    const cancelTour = () => {
      writeState(null)
      if (state.auto) markComplete()
    }

    const runSegment = () => {
      const isMobile = window.matchMedia('(max-width: 767px)').matches
      const usable = segmentDefs.filter((s: TourStepDef) => {
        if (s.device === 'mobile' && !isMobile) return false
        if (s.device === 'desktop' && isMobile) return false
        // Only drop optional steps when their anchor is genuinely absent
        // (e.g. the package grid is hidden when an ad is already active).
        // Steps we open ourselves (submenu) must stay even while collapsed.
        if (s.optional && s.element && !document.querySelector(s.element)) return false
        return true
      })

      if (usable.length === 0) {
        advanceOrFinish()
        return
      }

      const steps: DriveStep[] = usable.map((s) => ({
        element: s.element,
        popover: {
          title: t(s.titleKey),
          description: t(s.descKey),
          side: s.side,
          align: s.align,
          ...(s.onNext
            ? {
                onNextClick: () => {
                  if (s.onNext === 'openMenu') {
                    window.dispatchEvent(new Event('nm-tour-open-menu'))
                  } else if (s.onNext === 'openProfile') {
                    window.dispatchEvent(new Event('nm-tour-open-profile'))
                  }
                  // Wait for the drawer/submenu to render (300ms slide) before
                  // highlighting the next step's anchor.
                  window.setTimeout(() => d.moveNext(), 380)
                },
              }
            : {}),
        },
      }))

      outcomeRef.current = 'pending'
      const d = driver({
        showProgress: false,
        allowClose: true,
        smoothScroll: true,
        overlayColor: 'rgba(17, 17, 40, 0.72)',
        stagePadding: 6,
        stageRadius: 12,
        popoverClass: 'nm-tour',
        nextBtnText: t('next'),
        prevBtnText: t('back'),
        doneBtnText: isLastSegment ? t('done') : t('continue'),
        steps,
        onNextClick: () => {
          if (d.isLastStep()) {
            outcomeRef.current = 'complete'
            d.destroy()
          } else {
            d.moveNext()
          }
        },
        onPrevClick: () => d.movePrevious(),
        onCloseClick: () => {
          outcomeRef.current = 'cancel'
          d.destroy()
        },
        onDestroyed: () => {
          driverRef.current = null
          const outcome = outcomeRef.current
          outcomeRef.current = 'pending'
          if (outcome === 'complete') advanceOrFinish()
          else if (outcome === 'teardown') {
            /* paused (navigated away / unmounted) — keep state for resume */
          } else cancelTour()
        },
      })
      driverRef.current = d
      d.drive()
    }

    let cancelled = false
    startingRef.current = true
    const firstWithEl = segmentDefs.find((s) => s.element)
    const begin = () => {
      startingRef.current = false
      if (!cancelled) runSegment()
    }

    if (firstWithEl?.element) {
      waitForElement(firstWithEl.element, 3500).then(begin)
    } else {
      const id = window.setTimeout(begin, 200)
      return () => {
        cancelled = true
        startingRef.current = false
        window.clearTimeout(id)
      }
    }

    return () => {
      cancelled = true
      startingRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, tick])

  // Auto-start once for a freshly onboarded model who hasn't seen it yet.
  useEffect(() => {
    if (!profile || profile.role !== 'model') return
    if (profile.tutorial_completed) return
    if (pathname !== '/dashboard/model') return
    if (readState()) return
    try {
      if (localStorage.getItem(DONE_KEY)) return
    } catch {
      // ignore
    }
    startTour('sedcard', true)
  }, [profile, pathname, startTour])

  // Tear down the driver when the provider unmounts.
  useEffect(() => {
    return () => {
      outcomeRef.current = 'teardown'
      driverRef.current?.destroy()
      driverRef.current = null
    }
  }, [])

  return (
    <TutorialContext.Provider value={{ startTour, endTour }}>
      {children}
    </TutorialContext.Provider>
  )
}
