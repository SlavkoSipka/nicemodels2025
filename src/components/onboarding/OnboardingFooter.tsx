'use client'

import { useTranslations } from 'next-intl'

export default function OnboardingFooter() {
  const t = useTranslations('onboarding')
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full border-t border-gray-200/80 bg-white/70 backdrop-blur-sm z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-1">
        <p className="text-xs text-gray-500">
          {t('footerCopyright', { year: new Date().getFullYear() })}
        </p>
        <p className="text-[11px] text-gray-400 text-center md:text-right">
          {t('footerTagline')}
        </p>
      </div>
    </footer>
  )
}

