'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { LanguageCode, defaultLanguage } from '@/lib/i18n/config'
import { getTranslations } from '@/lib/i18n/translations'
import type { Translations } from '@/lib/i18n/translations/en'

interface LanguageContextType {
  locale: LanguageCode
  setLocale: (locale: LanguageCode) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'preferred-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LanguageCode>(defaultLanguage)
  const [t, setT] = useState<Translations>(getTranslations(defaultLanguage))

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode
    if (saved && saved in getTranslations) {
      setLocaleState(saved)
      setT(getTranslations(saved))
    }
  }, [])

  const setLocale = (newLocale: LanguageCode) => {
    setLocaleState(newLocale)
    setT(getTranslations(newLocale))
    localStorage.setItem(STORAGE_KEY, newLocale)
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

