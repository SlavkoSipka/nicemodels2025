'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/tracking'

/**
 * Fires a page_view event on every client-side route change.
 * Excluded: anything under /dashboard/admin (admin views of own panel shouldn't be counted).
 */
export default function PageTracker() {
  const pathname = usePathname()
  const search = useSearchParams()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/dashboard/admin')) return

    const search_str = search?.toString()
    const full = search_str ? `${pathname}?${search_str}` : pathname

    // Avoid firing twice for the same path (React strict mode, etc.)
    if (lastPath.current === full) return
    lastPath.current = full

    // Small delay so we don't log users who immediately bounce.
    const t = setTimeout(() => trackPageView(full), 400)
    return () => clearTimeout(t)
  }, [pathname, search])

  return null
}
