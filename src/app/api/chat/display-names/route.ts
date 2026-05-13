import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { clientIpFromHeaders, hitRateLimit } from '@/lib/rateLimit'

const MAX_IDS = 80

export async function POST(request: NextRequest) {
  try {
    const rip = clientIpFromHeaders(request.headers)
    if (hitRateLimit(`chat-names:${rip}`, { windowMs: 60_000, maxRequests: 80 })) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const userIdsRaw = body?.userIds

    if (!Array.isArray(userIdsRaw) || userIdsRaw.length === 0) {
      return NextResponse.json({ names: {} })
    }

    const userIds = [
      ...new Set(
        userIdsRaw.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0 && id.length < 128),
      ),
    ].slice(0, MAX_IDS)

    if (userIds.length === 0) {
      return NextResponse.json({ names: {} })
    }

    const admin = createAdminClient()

    const [{ data: profiles }, { data: modelDetails }] = await Promise.all([
      admin.from('profiles').select('id, username, role').in('id', userIds),
      admin.from('model_details').select('model_id, showname').in('model_id', userIds),
    ])

    const shownameMap = new Map((modelDetails || []).map((d: { model_id: string; showname: string | null }) => [d.model_id, d.showname]))

    const names: Record<string, string> = {}
    for (const p of profiles || []) {
      if (p.role === 'model' && shownameMap.get(p.id)) {
        names[p.id] = shownameMap.get(p.id) as string
      } else {
        names[p.id] = p.username || 'User'
      }
    }

    return NextResponse.json({ names })
  } catch {
    return NextResponse.json({ names: {} })
  }
}
