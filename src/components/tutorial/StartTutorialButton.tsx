'use client'

import { useTranslations } from 'next-intl'
import { GraduationCap } from 'lucide-react'
import { useTutorial } from './TutorialProvider'

export default function StartTutorialButton({ className }: { className?: string }) {
  const t = useTranslations('dashboard.model.tutorial')
  const { startTour } = useTutorial()

  return (
    <button
      type="button"
      onClick={() => startTour('sedcard')}
      className={
        className ||
        'inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors'
      }
    >
      <GraduationCap className="w-3.5 h-3.5" />
      {t('startButton')}
    </button>
  )
}
