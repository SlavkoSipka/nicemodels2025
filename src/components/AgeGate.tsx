'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const COOKIE_NAME = 'age_verified'
const COOKIE_DAYS = 60

// Routes that are already behind login — no age gate needed.
const EXCLUDED_PREFIXES = [
  '/dashboard',
  '/auth',
  '/login',
  '/register',
  '/onboarding',
  '/forgot-password',
  '/reset-password',
  '/chat',
]

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()!.split(';').shift() ?? null
  return null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setDate(expires.getDate() + days)
  // Secure flag: no-op on HTTP dev, enforced on HTTPS prod.
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`
}

export default function AgeGate() {
  const pathname = usePathname()
  // Initial state is always false — overlay never appears in SSR HTML.
  // Full page content (H1, listings, JSON-LD) is always in the DOM.
  const [visible, setVisible] = useState(false)
  const jaRef = useRef<HTMLButtonElement>(null)
  const neinRef = useRef<HTMLButtonElement>(null)

  // Cookie check is intentionally client-side only so bots receive identical HTML.
  useEffect(() => {
    if (EXCLUDED_PREFIXES.some(prefix => pathname.startsWith(prefix))) return
    if (!getCookie(COOKIE_NAME)) {
      setVisible(true)
    }
  }, [pathname])

  // Focus the confirm button when overlay mounts.
  useEffect(() => {
    if (visible) jaRef.current?.focus()
  }, [visible])

  // Focus trap — Tab cycles only between the two buttons while the gate is open.
  useEffect(() => {
    if (!visible) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const buttons = [jaRef.current, neinRef.current].filter(Boolean) as HTMLButtonElement[]
      const idx = buttons.indexOf(document.activeElement as HTMLButtonElement)
      e.preventDefault()
      const next = e.shiftKey
        ? buttons[(idx - 1 + buttons.length) % buttons.length]
        : buttons[(idx + 1) % buttons.length]
      next.focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible])

  if (!visible) return null

  const handleJa = () => {
    setCookie(COOKIE_NAME, 'true', COOKIE_DAYS)
    setVisible(false)
  }

  const handleNein = () => {
    window.location.href = 'https://www.google.com'
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '1rem',
          padding: '2.5rem 2rem',
          maxWidth: '440px',
          width: '90%',
          textAlign: 'center',
          border: '2px solid #f9a8d4',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}
      >
        {/* Brand accent circle */}
        <div
          aria-hidden="true"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #be185d, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2
          id="age-gate-title"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1a1a2e',
            marginBottom: '0.5rem',
          }}
        >
          Altersverifikation
        </h2>

        <p
          style={{
            color: '#64748b',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            marginBottom: '0.25rem',
          }}
        >
          Diese Website enthält Inhalte ausschliesslich für Erwachsene.
        </p>

        <p
          style={{
            fontWeight: 700,
            fontSize: '1.05rem',
            color: '#1a1a2e',
            marginBottom: '2rem',
          }}
        >
          Sind Sie über 18 Jahre alt?
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            ref={jaRef}
            onClick={handleJa}
            style={{
              flex: 1,
              padding: '0.8rem 1rem',
              background: 'linear-gradient(135deg, #be185d, #ec4899)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Ja, ich bin 18+
          </button>
          <button
            ref={neinRef}
            onClick={handleNein}
            style={{
              flex: 1,
              padding: '0.8rem 1rem',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            Nein
          </button>
        </div>

        <p
          style={{
            marginTop: '1.25rem',
            fontSize: '0.72rem',
            color: '#94a3b8',
            lineHeight: 1.5,
          }}
        >
          Mit dem Klick auf «Ja» bestätigen Sie, dass Sie das gesetzliche Mindestalter von
          18 Jahren erreicht haben und der Zugriff auf diese Inhalte in Ihrem Land gestattet ist.
        </p>
      </div>
    </div>
  )
}
