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
  profileError: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  profileError: false,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

function withTimeout<T>(p: Promise<T>, ms: number, label = 'request'): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms)
  })
  return Promise.race([p, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)
  const fetchedFor = useRef<string | null>(null)

  const loadProfile = useCallback(async (uid: string) => {
    const supabase = createClient()
    try {
      const { data } = await withTimeout(
        supabase
          .from('profiles')
          .select('id, username, role, avatar_url, onboarding_completed')
          .eq('id', uid)
          .maybeSingle(),
        8000,
        'loadProfile',
      )
      if (data) {
        setProfile(data as AuthProfile)
        setProfileError(false)
      } else {
        setProfileError(true)
      }
    } catch {
      setProfileError(true)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    fetchedFor.current = null
    setProfileError(false)
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
    setProfileError(false)
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

    // Hard failsafe: if getSession() never resolves (e.g. token refresh hangs
    // on a flaky mobile network), force isLoading=false after 5s so consumers
    // can move on instead of spinning forever.
    const failsafe = setTimeout(() => {
      if (!cancelled) setIsLoading(false)
    }, 5000)

    // Initial session read — wraps in timeout so the failsafe is rarely needed.
    withTimeout(supabase.auth.getSession(), 5000, 'getSession')
      .then(({ data: { session } }) => {
        if (cancelled) return
        const u = session?.user ?? null
        setUser(u)
        setIsLoading(false)
        if (u && fetchedFor.current !== u.id) {
          fetchedFor.current = u.id
          loadProfile(u.id).catch(() => {})
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })

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
      clearTimeout(failsafe)
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, isLoading, profileError, signOut, refreshProfile }),
    [user, profile, isLoading, profileError, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
