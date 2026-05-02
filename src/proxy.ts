import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { VALID_CANTONS } from '@/lib/cantons'

const CANTON_COOKIE_NAME = 'nm-canton'
const CANTON_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

/**
 * Read Netlify's `x-nf-geo` edge header and return the visitor's Swiss
 * canton ISO code if available. Returns empty string when geo lookup
 * is missing/invalid or the visitor is outside CH/LI — we still set
 * the cookie so the client can distinguish "unknown" from "not yet set".
 */
function detectVisitorCanton(request: NextRequest): string {
  const nfGeo = request.headers.get('x-nf-geo')
  if (!nfGeo) return ''
  try {
    const decoded = JSON.parse(Buffer.from(nfGeo, 'base64').toString('utf-8'))
    const sub = decoded?.subdivision?.code
    const country = decoded?.country?.code
    if (
      typeof sub === 'string'
      && (country === 'CH' || country === 'LI')
      && VALID_CANTONS.has(sub)
    ) {
      return sub
    }
  } catch {
    // ignore malformed header
  }
  return ''
}

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)

  // Set visitor canton cookie once per session (7 days). Used by the home
  // and models pages to filter banners by region.
  if (!request.cookies.get(CANTON_COOKIE_NAME)) {
    response.cookies.set(CANTON_COOKIE_NAME, detectVisitorCanton(request), {
      maxAge: CANTON_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

