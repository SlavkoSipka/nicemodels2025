import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Debug-only endpoint. Returns the raw and decoded `x-nf-geo` header that
 * Netlify Edge attaches to every request, plus the current `nm-canton`
 * cookie value. Useful for confirming geo-detection works for visitors in
 * specific Swiss cantons (e.g. AG, ZH) without having to spin up a VPN.
 *
 * Locked to admins so it can't be scraped by random visitors.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'cache-control': 'no-store' } })
  }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'cache-control': 'no-store' } })
  }

  const raw = req.headers.get('x-nf-geo') || null

  let decoded: unknown = null
  let decodeError: string | null = null
  if (raw) {
    try {
      decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
    } catch (e: unknown) {
      decodeError = e instanceof Error ? e.message : 'failed to decode x-nf-geo'
    }
  }

  const cantonCookie = req.cookies.get('nm-canton')?.value ?? null

  const geo =
    decoded && typeof decoded === 'object'
      ? (decoded as Record<string, unknown>)
      : null
  const countryObj =
    geo?.country && typeof geo.country === 'object'
      ? (geo.country as Record<string, unknown>)
      : null
  const subdivisionObj =
    geo?.subdivision && typeof geo.subdivision === 'object'
      ? (geo.subdivision as Record<string, unknown>)
      : null
  const countryCode =
    typeof countryObj?.code === 'string' ? countryObj.code : null
  const subdivisionCode =
    typeof subdivisionObj?.code === 'string' ? subdivisionObj.code : null
  const detectedCity = geo?.city ?? null

  return NextResponse.json(
    {
      now: new Date().toISOString(),
      raw_x_nf_geo: raw,
      decoded,
      decodeError,
      detected_country: countryCode,
      detected_subdivision: subdivisionCode,
      detected_city: detectedCity,
      cookie_nm_canton: cantonCookie,
      ip_hint:
        req.headers.get('x-nf-client-connection-ip') ||
        req.headers.get('x-forwarded-for') ||
        null,
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
