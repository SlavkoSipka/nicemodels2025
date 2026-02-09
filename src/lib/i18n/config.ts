// i18n Configuration
export const languages = {
  en: { name: 'English', flag: '🇬🇧', code: 'en' },
  de: { name: 'Deutsch', flag: '🇩🇪', code: 'de' },
  es: { name: 'Español', flag: '🇪🇸', code: 'es' },
  fr: { name: 'Français', flag: '🇫🇷', code: 'fr' },
  ro: { name: 'Română', flag: '🇷🇴', code: 'ro' },
  it: { name: 'Italiano', flag: '🇮🇹', code: 'it' },
  hu: { name: 'Magyar', flag: '🇭🇺', code: 'hu' },
} as const

export type LanguageCode = keyof typeof languages

export const defaultLanguage: LanguageCode = 'en'

export const languageNames: Record<LanguageCode, string> = {
  en: 'EN',
  de: 'DE',
  es: 'ES',
  fr: 'FR',
  ro: 'RO',
  it: 'IT',
  hu: 'HU',
}

