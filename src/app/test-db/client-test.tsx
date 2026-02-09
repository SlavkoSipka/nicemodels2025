'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ClientTest() {
  const [status, setStatus] = useState<{
    connected: boolean
    error: string | null
    profilesCount: number
  }>({
    connected: false,
    error: null,
    profilesCount: 0,
  })

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()

        // Test query
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (error) throw error

        setStatus({
          connected: true,
          error: null,
          profilesCount: count || 0,
        })
      } catch (error: any) {
        console.error('Client-side test error:', error)
        setStatus({
          connected: false,
          error: error.message,
          profilesCount: 0,
        })
      }
    }

    testConnection()
  }, [])

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <h2 className="font-semibold mb-3 text-lg">Client-Side Test:</h2>
      <div className={`p-3 rounded ${status.connected ? 'bg-green-100' : 'bg-red-100'}`}>
        {status.connected ? (
          <div className="text-green-700">
            ✅ Client-side connection successful! Found {status.profilesCount} profiles.
          </div>
        ) : (
          <div className="text-red-700">
            ❌ Client-side connection failed
            {status.error && <div className="mt-2 text-sm">Error: {status.error}</div>}
          </div>
        )}
      </div>
      <div className="mt-3 text-xs text-gray-600">
        <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</div>
        <div>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET'}</div>
      </div>
    </div>
  )
}

