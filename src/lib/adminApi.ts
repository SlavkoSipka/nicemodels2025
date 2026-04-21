import { createClient } from '@/lib/supabase/server'

// Re-export pure utilities so callers that previously imported from here still work.
export { RangeKey, rangeToDate, parseRange, bucketByDay, shortDate } from '@/lib/adminUtils'

/**
 * Verifies the current request comes from an admin user.
 * Returns the user on success, or null on failure.
 * SERVER-ONLY — uses next/headers via createClient.
 */
export async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin' ? user : null
}
