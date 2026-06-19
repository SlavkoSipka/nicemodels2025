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
  tutorial_completed: boolean | null
  phone: string | null
  date_of_birth: string | null
  is_blocked?: boolean | null
  blocked_reason?: string | null
  blocked_at?: string | null
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

type AuthProviderProps = {
  children: React.ReactNode
  initialUser: User | null
  initialProfile: AuthProfile | null
}

export default function AuthProvider({
  children,
  initialUser,
  initialProfile,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<AuthProfile | null>(initialProfile)
  const [isLoading] = useState(false)
  const [profileError, setProfileError] = useState(false)
  const fetchedFor = useRef<string | null>(initialUser?.id ?? null)

  const loadProfile = useCallback(async (uid: string) => {
    const supabase = createClient()
    try {
      const { data } = await withTimeout(
        supabase
          .from('profiles')
          .select(
            'id, username, role, avatar_url, onboarding_completed, tutorial_completed, phone, date_of_birth, is_blocked, blocked_reason, blocked_at',
          )
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
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      // ignore network errors during signout
    }
    setUser(null)
    setProfile(null)
    setProfileError(false)
    fetchedFor.current = null
    if (typeof window !== 'undefined') {
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-')) localStorage.removeItem(key)
        }
        for (const key of Object.keys(sessionStorage)) {
          if (key.startsWith('sb-')) sessionStorage.removeItem(key)
        }
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    if (!initialUser?.id || initialProfile) return
    fetchedFor.current = initialUser.id
    loadProfile(initialUser.id).catch(() => {})
  }, [initialUser?.id, initialProfile, loadProfile])

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)

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
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, isLoading, profileError, signOut, refreshProfile }),
    [user, profile, isLoading, profileError, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
