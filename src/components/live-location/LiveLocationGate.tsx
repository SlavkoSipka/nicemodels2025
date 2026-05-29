'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import LiveLocationWatcher from './LiveLocationWatcher'

export default function LiveLocationGate() {
  // Read the user from context instead of a per-mount auth.getUser() round-trip.
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('model_details')
        .select('share_live_location')
        .eq('model_id', user.id)
        .single()
      if (active && data?.share_live_location) setEnabled(true)
    })()
    return () => { active = false }
  }, [user])

  if (!enabled) return null
  return <LiveLocationWatcher />
}
