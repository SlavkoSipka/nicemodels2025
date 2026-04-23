'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type NearbyEntity = 'model' | 'club' | 'listing'

/**
 * Resolves entity IDs within `radiusKm` of `originCity` via `entities_near_origin` RPC.
 * Returns:
 *   - `null`  while inactive (no origin/radius) -> caller should NOT filter
 *   - `Set<string>` of matching entity IDs when active
 *   - `Set<string>()` (empty) when origin couldn't be resolved or no matches
 */
export function useNearbyIds(
  entity: NearbyEntity,
  originCity: string | null,
  radiusKm: number | null,
): { ids: Set<string> | null; loading: boolean } {
  const [ids, setIds] = useState<Set<string> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!originCity || !radiusKm || radiusKm <= 0) {
        setIds(null)
        return
      }
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('entities_near_origin', {
          p_origin_city: originCity,
          p_radius_km: radiusKm,
          p_entity: entity,
        })
        if (cancelled) return
        if (error) {
          console.error('entities_near_origin error:', error)
          setIds(new Set())
          return
        }
        const s = new Set<string>((data || []).map((r: { entity_id: string }) => String(r.entity_id)))
        setIds(s)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [entity, originCity, radiusKm])

  return { ids, loading }
}
