import { NextRequest, NextResponse } from 'next/server'
import { hitRateLimit, clientIpFromHeaders } from '@/lib/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type EventType =
  | 'page_view'
  | 'listing_view'
  | 'listing_click'
  | 'banner_impression'
  | 'banner_click'

interface EventBody {
  event_type: EventType
  payload: Record<string, any>
}

function getIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') || null
}

export async function POST(request: NextRequest) {
  try {
    const rip = clientIpFromHeaders(request.headers)
    if (hitRateLimit(`track:${rip}`, { windowMs: 60_000, maxRequests: 120 })) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }

    const { event_type, payload = {} } = (await request.json()) as EventBody
    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 })
    }

    // Best-effort identify viewer and role from session cookie
    let viewer_id: string | null = null
    let viewer_role: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        viewer_id = user.id
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        viewer_role = profile?.role ?? null
      }
    } catch {
      // ignore auth errors; event still gets logged anonymously
    }

    const ua = request.headers.get('user-agent')
    const ip = getIp(request)
    const admin = createAdminClient()

    switch (event_type) {
      case 'page_view': {
        const path = String(payload.path || '')
        if (!path) return NextResponse.json({ ok: true })
        if (path.startsWith('/dashboard/admin')) return NextResponse.json({ ok: true })
        await admin.from('page_views').insert({
          path,
          viewer_id,
          viewer_role,
          session_id: payload.session_id || null,
          referrer: payload.referrer || null,
          user_agent: ua,
          ip_address: ip,
        })
        break
      }
      case 'listing_view': {
        const listing_id = String(payload.listing_id || '')
        if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
        const { error } = await admin.from('listing_views').insert({
          listing_id,
          viewer_id,
          viewer_role,
          user_agent: ua,
          ip_address: ip,
        })
        if (error) console.error('[track/event] listing_view insert error:', error)
        break
      }
      case 'listing_click': {
        const listing_id = String(payload.listing_id || '')
        const click_type = String(payload.click_type || '')
        if (!listing_id || !click_type) {
          return NextResponse.json({ error: 'listing_id and click_type required' }, { status: 400 })
        }
        const { error } = await admin.from('listing_clicks').insert({
          listing_id,
          viewer_id,
          click_type,
          user_agent: ua,
          ip_address: ip,
        })
        if (error) console.error('[track/event] listing_click insert error:', error)
        break
      }
      case 'banner_impression': {
        const banner_id = String(payload.banner_id || '')
        if (!banner_id) return NextResponse.json({ error: 'banner_id required' }, { status: 400 })
        await admin.from('banner_impressions').insert({
          banner_id,
          viewer_id,
          page_path: payload.page_path || null,
          user_agent: ua,
          ip_address: ip,
        })
        break
      }
      case 'banner_click': {
        const banner_id = String(payload.banner_id || '')
        if (!banner_id) return NextResponse.json({ error: 'banner_id required' }, { status: 400 })
        await admin.from('banner_clicks').insert({
          banner_id,
          viewer_id,
          click_type: payload.click_type || null,
          page_path: payload.page_path || null,
          user_agent: ua,
          ip_address: ip,
        })
        break
      }
      default:
        return NextResponse.json({ error: 'unknown event_type' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'server error' }, { status: 500 })
  }
}
