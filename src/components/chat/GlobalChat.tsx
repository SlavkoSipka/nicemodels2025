'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'

// Loaded lazily and only for logged-in users. Hosted in the root layout (not in
// Navbar) so it persists across client navigations instead of remounting — and
// re-establishing its realtime channels + conversation fetch — on every page.
const ChatWidget = dynamic(() => import('./ChatWidget'), {
  ssr: false,
  loading: () => null,
})

// Routes that intentionally have no public chrome / where the floating widget
// should not appear.
const HIDDEN_PREFIXES = [
  '/dashboard',
  '/onboarding',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
]

export default function GlobalChat() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null
  if (pathname && HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null

  return <ChatWidget />
}
