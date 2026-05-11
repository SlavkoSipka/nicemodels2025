'use client'

import { useEffect, useState } from 'react'

/**
 * Detect in-app WebView browsers (Gmail, Facebook, Instagram, Line, TikTok,
 * KakaoTalk, etc.) where cookies / WebSockets / sessions are unreliable.
 *
 * Strategy: only block KNOWN broken in-app webviews. Full mobile browsers
 * (Chrome, Safari, Samsung Internet, Firefox, Edge) pass through unchanged.
 */
function detectInApp(ua: string): { inApp: boolean; platform: 'android' | 'ios' | 'other' } {
  const platform: 'android' | 'ios' | 'other' = /iPhone|iPad|iPod/i.test(ua)
    ? 'ios'
    : /Android/i.test(ua)
      ? 'android'
      : 'other'

  // Known in-app webview markers.
  const inAppPatterns = [
    /FBAN|FBAV|FB_IAB/i,        // Facebook / Messenger
    /Instagram/i,
    /Line\//i,
    /KAKAOTALK/i,
    /Twitter|TwitterAndroid/i,
    /TikTok|musical_ly/i,
    /Pinterest/i,
    /Snapchat/i,
    /WhatsApp/i,
    /LinkedInApp/i,
    /MicroMessenger/i,         // WeChat
    /; wv\)/i,                 // Generic Android WebView (parenthesised " wv)")
  ]

  let inApp = inAppPatterns.some((re) => re.test(ua))

  // iOS Gmail uses GSA (Google Search App) variants, and a generic in-app
  // webview leaves out the "Safari/" suffix that mobile Safari always sets.
  if (platform === 'ios' && /AppleWebKit/i.test(ua) && !/Safari\//i.test(ua)) {
    inApp = true
  }
  // Google Search App / Gmail Android sometimes set GSA/x.x.x.
  if (/\bGSA\//i.test(ua)) {
    inApp = true
  }

  return { inApp, platform }
}

function buildAndroidIntentUrl(href: string): string {
  // intent://host/path?query#Intent;scheme=https;action=android.intent.action.VIEW;end
  try {
    const u = new URL(href)
    const path = `${u.pathname}${u.search}${u.hash}`
    return `intent://${u.host}${path}#Intent;scheme=${u.protocol.replace(':', '')};action=android.intent.action.VIEW;end`
  } catch {
    return href
  }
}

export default function OpenInBrowserGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ inApp: boolean; platform: 'android' | 'ios' | 'other' } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    setState(detectInApp(navigator.userAgent || ''))
  }, [])

  // Until detection runs, render children (avoids SSR flicker on real browsers).
  if (!state || !state.inApp) return <>{children}</>

  const href = typeof window !== 'undefined' ? window.location.href : ''

  const handleAndroidOpen = () => {
    window.location.href = buildAndroidIntentUrl(href)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // older browsers — best-effort fallback
      const ta = document.createElement('textarea')
      ta.value = href
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-5 py-8">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
        <div className="w-14 h-14 mx-auto rounded-full bg-pink-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14L21 3m0 0h-7m7 0v7M5 5h6M5 5v14h14v-6" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
          Open in your browser
        </h2>
        <p className="text-sm text-gray-600 text-center mb-5">
          This page does not work reliably inside in-app browsers (Gmail, Facebook, Instagram, etc.).
          Please continue in your phone&apos;s default browser to finish signing in.
        </p>

        {state.platform === 'android' && (
          <button
            onClick={handleAndroidOpen}
            className="w-full py-3 mb-2 text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg shadow-md hover:from-pink-700 hover:to-rose-700 transition-all"
          >
            Open in browser
          </button>
        )}

        {state.platform === 'ios' && (
          <>
            <button
              onClick={handleCopy}
              className="w-full py-3 mb-2 text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg shadow-md hover:from-pink-700 hover:to-rose-700 transition-all"
            >
              {copied ? 'Link copied' : 'Copy link'}
            </button>
            <p className="text-xs text-gray-500 text-center leading-relaxed mb-2">
              Then open <strong>Safari</strong> (or Chrome), tap the address bar and paste.
            </p>
          </>
        )}

        {state.platform === 'other' && (
          <button
            onClick={handleCopy}
            className="w-full py-3 mb-2 text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg shadow-md hover:from-pink-700 hover:to-rose-700 transition-all"
          >
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        )}

        <details className="mt-3">
          <summary className="text-xs text-gray-400 text-center cursor-pointer select-none">
            Or copy the link manually
          </summary>
          <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-mono text-gray-700 break-all">
            {href}
          </div>
        </details>
      </div>
    </div>
  )
}
