import { createClient } from '@/lib/supabase/server'

// Pure helpers live in adminUtils so client code can import them without server deps.
export { rangeToDate, parseRange, bucketByDay, shortDate } from '@/lib/adminUtils'
export type { RangeKey } from '@/lib/adminUtils'

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
