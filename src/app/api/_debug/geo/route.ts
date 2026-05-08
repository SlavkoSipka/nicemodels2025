import { NextRequest, NextResponse } from 'next/server'

/**
 * Debug-only endpoint. Returns the raw and decoded `x-nf-geo` header that
 * Netlify Edge attaches to every request, plus the current `nm-canton`
 * cookie value. Useful for confirming geo-detection works for visitors in
 * specific Swiss cantons (e.g. AG, ZH) without having to spin up a VPN.
 *
 * Open it from the actual visitor's network (or a VPN exit) at:
 *   https://nicemodels.ch/api/_debug/geo
 *
 * Locked to admins so it can't be scraped by random visitors.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const raw = req.headers.get('x-nf-geo') || null

  let decoded: unknown = null
  let decodeError: string | null = null
  if (raw) {
    try {
      decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
    } catch (e: any) {
      decodeError = e?.message || 'failed to decode x-nf-geo'
    }
  }

  const cantonCookie = req.cookies.get('nm-canton')?.value ?? null

  return NextResponse.json(
    {
      now: new Date().toISOString(),
      raw_x_nf_geo: raw,
      decoded,
      decodeError,
      detected_country:
        (decoded as any)?.country?.code ?? null,
      detected_subdivision:
        (decoded as any)?.subdivision?.code ?? null,
      detected_city: (decoded as any)?.city ?? null,
      cookie_nm_canton: cantonCookie,
      ip_hint:
        req.headers.get('x-nf-client-connection-ip') ||
        req.headers.get('x-forwarded-for') ||
        null,
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
