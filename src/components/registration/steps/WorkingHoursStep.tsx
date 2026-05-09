'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft } from 'lucide-react'
import { RegistrationData } from '../ModelRegistrationWizard'

interface Props {
  data: RegistrationData
  updateData: (data: Partial<RegistrationData>) => void
  nextStep: () => void
  prevStep: () => void
  currentStep: number
  totalSteps: number
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

export default function WorkingHoursStep({ data, updateData, nextStep, prevStep, currentStep, totalSteps }: Props) {
  const t = useTranslations('components.modelRegistration.workingHours')
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
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={() => updateData({ workingHoursType: 'custom' })}
            className={`px-6 py-2 rounded-full border transition ${
              data.workingHoursType === 'custom'
                ? 'bg-pink-100 border-pink-500 text-pink-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            {t('custom')}
          </button>
          <button
            type="button"
            onClick={() => updateData({ workingHoursType: 'same' })}
            className={`px-6 py-2 rounded-full border transition ${
              data.workingHoursType === 'same'
                ? 'bg-pink-100 border-pink-500 text-pink-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            {t('sameEveryDay')}
          </button>
          <button
            type="button"
            onClick={() => updateData({ workingHoursType: '24/7' })}
            className={`px-6 py-2 rounded-full border transition ${
              data.workingHoursType === '24/7'
                ? 'bg-pink-600 border-pink-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            {t('available247')}
          </button>
        </div>

        {data.workingHoursType === 'custom' && (
          <div className="mb-6 p-6 bg-gray-50 rounded">
            <p className="text-gray-700 mb-4">{t('customHint')}</p>
            <div className="space-y-3">
              {DAY_KEYS.map((dayKey) => (
                <div key={dayKey} className="flex flex-wrap items-center gap-4">
                  <span className="w-28 font-medium">{t(`days.${dayKey}`)}</span>
                  <input
                    type="time"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <span>{t('to')}</span>
                  <input
                    type="time"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-pink-600" />
                    <span className="text-sm">{t('dayOff')}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.workingHoursType === 'same' && (
          <div className="mb-6 p-6 bg-gray-50 rounded">
            <p className="text-gray-700 mb-4">{t('sameHint')}</p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium">{t('from')}</span>
              <input
                type="time"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="font-medium">{t('to')}</span>
              <input
                type="time"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        )}

        <div className="mb-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showAsNightEscort}
              onChange={(e) => updateData({ showAsNightEscort: e.target.checked })}
              className="w-5 h-5 text-pink-600"
            />
            <div>
              <span className="font-medium">{t('nightEscort')}</span>
              <p className="text-sm text-gray-600">{t('nightEscortHint')}</p>
            </div>
          </label>
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
