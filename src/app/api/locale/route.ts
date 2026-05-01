import { NextRequest, NextResponse } from 'next/server'
import { SUPPORTED_LOCALES, LOCALE_COOKIE, type AppLocale } from '@/i18n/request'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const locale = body?.locale as string | undefined

  if (!locale || !(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true, locale })
  res.cookies.set(LOCALE_COOKIE, locale as AppLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return res
}
