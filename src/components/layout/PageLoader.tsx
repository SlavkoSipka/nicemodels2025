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

interface LoaderCtx { show: () => void }
const Ctx = createContext<LoaderCtx>({ show: () => {} })
export function usePageLoader() { return useContext(Ctx) }

const MIN_MS  = 420
const MAX_MS  = 1400
const FADE_MS = 280

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
    maxTimer.current = setTimeout(dismiss, MAX_MS)
  }, [dismiss])

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
            background: '#ffffff',
            animation: fadingOut
              ? `loader-bg-out ${FADE_MS}ms ease-in-out forwards`
              : 'loader-bg-in 200ms ease-out forwards',
            overflow: 'hidden',
          }}
        >
          {/* Ambient orbs */}
          <div style={{
            position: 'absolute', width: 400, height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)',
            top: '15%', left: '20%',
            animation: 'loader-orb-1 4s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', width: 350, height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(137,207,240,0.08) 0%, transparent 70%)',
            bottom: '15%', right: '15%',
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
                src="/logo.webp"
                alt="nicemodels.ch"
                width={220}
                height={55}
                priority
                style={{ height: 'auto', width: 220, filter: 'drop-shadow(0 0 20px rgba(236,72,153,0.15))' }}
              />
            </div>
          </div>

          <p
            className="font-semibold tracking-wide text-base"
            style={{
              color: '#be185d',
              marginTop: -24,
              marginBottom: 32,
              animation: fadingOut ? 'none' : 'loader-logo-pulse 1.4s ease-in-out infinite 0.5s',
            }}
          >
            models
          </p>

          {/* Progress bar */}
          <div style={{
            position:     'absolute',
            bottom:       0,
            left:         0,
            right:        0,
            height:       2,
            background:   '#f1f5f9',
          }}>
            <div style={{
              height:     '100%',
              background: 'linear-gradient(90deg, #ec4899, #f9a8d4, #89CFF0)',
              animation:  `loader-bar ${MAX_MS}ms cubic-bezier(0.4,0,0.2,1) forwards`,
              boxShadow:  '0 0 10px rgba(236,72,153,0.3)',
            }} />
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
