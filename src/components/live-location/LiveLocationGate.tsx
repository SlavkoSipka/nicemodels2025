'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LiveLocationWatcher from './LiveLocationWatcher'

export default function LiveLocationGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('model_details')
        .select('share_live_location')
        .eq('model_id', user.id)
        .single()
      if (data?.share_live_location) setEnabled(true)
    }
    check()
  }, [])

  if (!enabled) return null
  return <LiveLocationWatcher />
}
