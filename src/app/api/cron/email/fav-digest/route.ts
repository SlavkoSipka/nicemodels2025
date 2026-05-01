import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendFavDigestEmail, type FavDigestItem } from '@/lib/email/templates'

export const runtime = 'nodejs'
// Marked as dynamic so it is not cached and can be hit by a scheduler.
export const dynamic = 'force-dynamic'

/**
 * Daily favorite-update digest.
 *
 * Aggregates `notifications` rows of type fav_new_photo / fav_new_story /
 * fav_location_change / fav_back_online from the last 24 hours, groups them
 * per recipient, and sends one digest email per user.
 *
 * Auth: requires header `x-cron-secret: <CRON_SECRET>`. Plug into Supabase
 * Scheduled Functions, GitHub Actions cron, or Vercel/Netlify cron.
 */
const FAV_TYPES = ['fav_new_photo', 'fav_new_story', 'fav_location_change', 'fav_back_online']

const TYPE_LABEL: Record<string, FavDigestItem['events'][number]['kind']> = {
  fav_new_photo: 'photo',
  fav_new_story: 'story',
  fav_location_change: 'location',
  fav_back_online: 'online',
}

export async function POST(req: NextRequest) {
  return run(req)
}
export async function GET(req: NextRequest) {
  return run(req)
}

async function run(req: NextRequest) {
  const provided = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('cron_secret')
  const expected = process.env.CRON_SECRET
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: notes, error } = await admin
    .from('notifications')
    .select('user_id, type, title, message, related_entity_id')
    .in('type', FAV_TYPES)
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group: user_id -> model_id -> events[]
  type Group = Map<string, FavDigestItem>
  const byUser = new Map<string, Group>()

  for (const n of notes || []) {
    if (!n.user_id || !n.related_entity_id) continue
    const userMap = byUser.get(n.user_id) || new Map<string, FavDigestItem>()
    const modelId = String(n.related_entity_id)
    const item = userMap.get(modelId) || {
      modelId,
      modelName: n.title?.replace(/ posted .*$| moved .*$| is back online$/, '').trim() || 'A favorite',
      events: [],
    }
    item.events.push({
      kind: TYPE_LABEL[n.type] || 'photo',
      description: n.message || n.title || 'New update',
    })
    userMap.set(modelId, item)
    byUser.set(n.user_id, userMap)
  }

  if (byUser.size === 0) {
    return NextResponse.json({ ok: true, recipients: 0 })
  }

  const userIds = Array.from(byUser.keys())
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, username, is_blocked')
    .in('id', userIds)

  let sent = 0
  let skipped = 0
  for (const p of profiles || []) {
    if (!p.email || p.is_blocked) { skipped++; continue }
    const items = Array.from(byUser.get(p.id)!.values())
    const res = await sendFavDigestEmail({
      email: p.email,
      userId: p.id,
      displayName: p.username,
      items,
    })
    if (res.ok) sent++
    else skipped++
  }

  return NextResponse.json({ ok: true, recipients: byUser.size, sent, skipped })
}
