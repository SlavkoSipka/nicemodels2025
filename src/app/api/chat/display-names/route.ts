import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json()

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ names: {} })
    }

    const admin = createAdminClient()

    // Fetch all profiles and model shownames in parallel
    const [{ data: profiles }, { data: modelDetails }] = await Promise.all([
      admin.from('profiles').select('id, username, role').in('id', userIds),
      admin.from('model_details').select('model_id, showname').in('model_id', userIds),
    ])

    const shownameMap = new Map(
      (modelDetails || []).map((d: any) => [d.model_id, d.showname])
    )

    const names: Record<string, string> = {}
    for (const p of profiles || []) {
      if (p.role === 'model' && shownameMap.get(p.id)) {
        names[p.id] = shownameMap.get(p.id)!
      } else {
        names[p.id] = p.username || 'User'
      }
    }

    return NextResponse.json({ names })
  } catch {
    return NextResponse.json({ names: {} })
  }
}
