import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

export const SUPPORTED_LOCALES = ['de', 'en', 'fr', 'es', 'hu', 'ro', 'it', 'ru', 'pl', 'cs'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = 'de'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

function isSupported(value: string | undefined | null): value is AppLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

function negotiateFromAcceptLanguage(header: string | null): AppLocale | null {
  if (!header) return null
  const tags = header.split(',').map(p => p.trim().split(';')[0].toLowerCase())
  for (const tag of tags) {
    const base = tag.split('-')[0]
    if (isSupported(base)) return base
  }
  return null
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  let locale: AppLocale = isSupported(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  if (!isSupported(cookieLocale)) {
    const headerStore = await headers()
    const negotiated = negotiateFromAcceptLanguage(headerStore.get('accept-language'))
    if (negotiated) locale = negotiated
  }

  const loaders: Record<AppLocale, () => Promise<{ default: Record<string, unknown> }>> = {
    de: () => import('../../messages/de.json'),
    en: () => import('../../messages/en.json'),
    fr: () => import('../../messages/fr.json'),
    es: () => import('../../messages/es.json'),
    hu: () => import('../../messages/hu.json'),
    ro: () => import('../../messages/ro.json'),
    it: () => import('../../messages/it.json'),
    ru: () => import('../../messages/ru.json'),
    pl: () => import('../../messages/pl.json'),
    cs: () => import('../../messages/cs.json'),
  }
  const messages = (await loaders[locale]()).default

  return {
    locale,
    messages,
  }
})
