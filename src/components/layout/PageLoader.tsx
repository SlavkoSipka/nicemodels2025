'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'

interface LoaderCtx { show: () => void }
const Ctx = createContext<LoaderCtx>({ show: () => {} })
export function usePageLoader() { return useContext(Ctx) }

// Only show the loader if navigation is slow enough to be perceived.
// Fast nav (under DELAY_MS) shows nothing -> feels instant.
const DELAY_MS = 220
const MIN_MS   = 220
const MAX_MS   = 1200
const FADE_MS  = 180

export default function PageLoader({ children }: { children: React.ReactNode }) {
  const [visible,  setVisible]  = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  const pathname    = usePathname()
  const prevPath    = useRef(pathname)
  const startTime   = useRef(0)
  const maxTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const minTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const showTimer   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pendingDismiss = useRef(false)

  const dismiss = useCallback(() => {
    clearTimeout(maxTimer.current)
    clearTimeout(minTimer.current)
    clearTimeout(showTimer.current)
    setFadingOut(true)
    setTimeout(() => {
      setVisible(false)
      setFadingOut(false)
      pendingDismiss.current = false
    }, FADE_MS)
  }, [])

  const show = useCallback(() => {
    clearTimeout(maxTimer.current)
    clearTimeout(minTimer.current)
    clearTimeout(showTimer.current)
    pendingDismiss.current = false
    startTime.current = Date.now()
    // Defer showing the overlay so fast navigations don't flash a loader at all.
    showTimer.current = setTimeout(() => {
      setFadingOut(false)
      setVisible(true)
      maxTimer.current = setTimeout(dismiss, MAX_MS)
    }, DELAY_MS)
  }, [dismiss])

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname

    // Navigation finished. If overlay never got to show (fast page), cancel.
    clearTimeout(showTimer.current)
    if (!visible) return

    const elapsed   = Date.now() - startTime.current
    const remaining = Math.max(0, MIN_MS - elapsed)

    clearTimeout(maxTimer.current)
    if (remaining > 0) {
      minTimer.current = setTimeout(dismiss, remaining)
    } else {
      dismiss()
    }
  }, [pathname, visible, dismiss])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.getAttribute('target') === '_blank'
      ) return
      if (href === pathname) return
      if (pathname.startsWith('/dashboard') || href.startsWith('/dashboard')) return
      show()
    }
    document.addEventListener('click', handle, true)
    return () => document.removeEventListener('click', handle, true)
  }, [show, pathname])

  useEffect(() => () => {
    clearTimeout(showTimer.current)
    clearTimeout(maxTimer.current)
    clearTimeout(minTimer.current)
  }, [])

  return (
    <Ctx.Provider value={{ show }}>
      {children}

      {visible && (
        <>
          <style>{LOADER_KEYFRAMES}</style>
          {/*
            Slim top progress bar. Critically: the whole layer is
            `pointer-events: none` and only 3px tall, so it can NEVER cover the
            page or swallow the user's taps (the old full-screen white overlay
            was the main cause of "tap does nothing -> tap again"). Instant
            per-route loading.tsx skeletons provide the real content feedback.
          */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              zIndex: 9999,
              pointerEvents: 'none',
              background: 'transparent',
              opacity: fadingOut ? 0 : 1,
              transition: `opacity ${FADE_MS}ms ease-out`,
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #ec4899, #f9a8d4, #89CFF0)',
                animation: `loader-bar ${MAX_MS}ms cubic-bezier(0.4,0,0.2,1) forwards`,
                boxShadow: '0 0 10px rgba(236,72,153,0.4)',
                transformOrigin: 'left center',
              }}
            />
          </div>
        </>
      )}
    </Ctx.Provider>
  )
}

const LOADER_KEYFRAMES = `
@keyframes loader-bar {
  0% { width: 0% }
  40% { width: 55% }
  70% { width: 78% }
  100% { width: 96% }
}
`.trim()
