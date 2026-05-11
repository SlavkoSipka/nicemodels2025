'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export interface AuthProfile {
  id: string
  username: string | null
  role: string | null
  avatar_url: string | null
  onboarding_completed: boolean | null
}

interface AuthContextValue {
  user: User | null
  profile: AuthProfile | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fetchedFor = useRef<string | null>(null)

  const loadProfile = useCallback(async (uid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, username, role, avatar_url, onboarding_completed')
      .eq('id', uid)
      .maybeSingle()
    if (data) setProfile(data as AuthProfile)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    fetchedFor.current = null
    await loadProfile(user.id)
    fetchedFor.current = user.id
  }, [user?.id, loadProfile])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore network errors during signout
    }
    setUser(null)
    setProfile(null)
    fetchedFor.current = null
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.clear()
        window.sessionStorage.clear()
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    // Initial session read — local cookie/storage only, no network call.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      const u = session?.user ?? null
      setUser(u)
      setIsLoading(false)
      if (u && fetchedFor.current !== u.id) {
        fetchedFor.current = u.id
        loadProfile(u.id).catch(() => {})
      }
    })

    // Single source of truth for auth changes across the whole app.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setIsLoading(false)

      if (!u) {
        setProfile(null)
        fetchedFor.current = null
        return
      }

      if (fetchedFor.current !== u.id) {
        fetchedFor.current = u.id
        loadProfile(u.id).catch(() => {})
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, isLoading, signOut, refreshProfile }),
    [user, profile, isLoading, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
