'use client'

import { useEffect, useState } from 'react'
import { isValidCanton } from './cantons'

const COOKIE_NAME = 'nm-canton'

/**
 * Reads the visitor's canton from the `nm-canton` cookie set by middleware.
 *
 * Returns `null` until hydrated (SSR-safe), then either a canton ISO code
 * or `null` if the visitor is outside CH/LI or geo-IP couldn't determine
 * the canton.
 */
export function useVisitorCanton(): string | null {
  const [canton, setCanton] = useState<string | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'),
    )
    const raw = match ? decodeURIComponent(match[1]) : ''
    if (raw && isValidCanton(raw)) {
      setCanton(raw)
    } else {
      setCanton(null)
    }
  }, [])

  return canton
}
