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
import Image from 'next/image'

// ── Context ─────────────────────────────────────────────────────────────────
interface LoaderCtx { show: () => void }
const Ctx = createContext<LoaderCtx>({ show: () => {} })
export function usePageLoader() { return useContext(Ctx) }

// ── Constants ────────────────────────────────────────────────────────────────
const MIN_MS  = 420   // never dismiss before this
const MAX_MS  = 1400  // force-dismiss after this
const FADE_MS = 280   // fade-out duration

// ── Component ────────────────────────────────────────────────────────────────
export default function PageLoader({ children }: { children: React.ReactNode }) {
  const [visible,  setVisible]  = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  const pathname    = usePathname()
  const prevPath    = useRef(pathname)
  const startTime   = useRef(0)
  const maxTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const minTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pendingDismiss = useRef(false)

  const dismiss = useCallback(() => {
    clearTimeout(maxTimer.current)
    clearTimeout(minTimer.current)
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
    pendingDismiss.current = false
    startTime.current = Date.now()
    setFadingOut(false)
    setVisible(true)

    // Hard cap
    maxTimer.current = setTimeout(dismiss, MAX_MS)
  }, [dismiss])

  // Dismiss when pathname changes (page finished loading)
  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
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

  // Intercept ALL internal link clicks globally
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
      // Same page → no loader
      if (href === pathname) return
      // Dashboard navigation → no loader (neither from nor to dashboard)
      if (pathname.startsWith('/dashboard') || href.startsWith('/dashboard')) return
      show()
    }
    document.addEventListener('click', handle, true)
    return () => document.removeEventListener('click', handle, true)
  }, [show, pathname])

  return (
    <Ctx.Provider value={{ show }}>
      {children}

      {visible && (
        <div
          aria-hidden="true"
          style={{
            position:  'fixed',
            inset:     0,
            zIndex:    9999,
            display:   'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            animation: fadingOut
              ? `loader-bg-out ${FADE_MS}ms ease-in-out forwards`
              : 'loader-bg-in 200ms ease-out forwards',
            overflow: 'hidden',
          }}
        >
          {/* Ambient orbs */}
          <div style={{
            position: 'absolute', width: 360, height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,78,216,0.07) 0%, transparent 70%)',
            top: '10%', left: '15%',
            animation: 'loader-orb-1 4s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', width: 300, height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
            bottom: '15%', right: '12%',
            animation: 'loader-orb-2 5s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div style={{
            animation: fadingOut
              ? `loader-bg-out ${FADE_MS}ms ease-in forwards`
              : 'loader-logo-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
            marginBottom: 40,
          }}>
            <div style={{
              animation: fadingOut ? 'none' : 'loader-logo-pulse 1.4s ease-in-out infinite 0.5s',
            }}>
              <Image
                src="/logo2.png"
                alt="nicemodels.ch"
                width={220}
                height={55}
                priority
                style={{ height: 'auto', width: 220, filter: 'drop-shadow(0 0 28px rgba(59,130,246,0.5))' }}
              />
            </div>
          </div>

          {/* Progress bar track */}
          <div style={{
            position:     'absolute',
            bottom:       0,
            left:         0,
            right:        0,
            height:       3,
            background:   'rgba(255,255,255,0.06)',
          }}>
            <div style={{
              height:     '100%',
              background: 'linear-gradient(90deg, #1D4ED8, #3B82F6, #93C5FD)',
              animation:  `loader-bar ${MAX_MS}ms cubic-bezier(0.4,0,0.2,1) forwards`,
              boxShadow:  '0 0 12px rgba(59,130,246,0.8)',
            }} />
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
