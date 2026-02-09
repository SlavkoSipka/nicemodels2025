import { en } from './en'
import { de } from './de'
import { fr } from './fr'
import { es } from './es'
import { it } from './it'
import { ro } from './ro'
import { hu } from './hu'
import { LanguageCode } from '../config'

export const translations = {
  en,
  de,
  fr,
  es,
  it,
  ro,
  hu,
} as const

export function getTranslations(locale: LanguageCode) {
  return translations[locale] || translations.en
}

