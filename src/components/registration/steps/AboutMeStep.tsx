'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft } from 'lucide-react'
import { RegistrationData } from '../ModelRegistrationWizard'
import RichTextEditor from '@/components/ui/RichTextEditor'

interface Props {
  data: RegistrationData
  updateData: (data: Partial<RegistrationData>) => void
  nextStep: () => void
  prevStep: () => void
  currentStep: number
  totalSteps: number
}

export default function AboutMeStep({ data, updateData, nextStep, prevStep, currentStep, totalSteps }: Props) {
  const t = useTranslations('components.modelRegistration.aboutMe')
  const tc = useTranslations('components.modelRegistration.common')

  return (
    <div>
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" onClick={prevStep} />
            <h1 className="text-2xl font-bold">{t('title')}</h1>
          </div>
          <div className="bg-white text-pink-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <p className="mb-6 text-gray-700">{t('intro')}</p>

        <div className="mb-6">
          <RichTextEditor
            value={data.description}
            onChange={(val) => updateData({ description: val })}
            label={t('label')}
            required
            placeholder={t('placeholder')}
            maxLength={25000}
            height={350}
          />
        </div>

        <button
          type="button"
          onClick={nextStep}
          className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-8 py-3 rounded font-semibold hover:from-pink-700 hover:to-pink-600 transition"
        >
          {tc('nextStep')}
        </button>
      </div>
    </div>
  )
}
