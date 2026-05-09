'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft } from 'lucide-react'
import { RegistrationData } from '../ModelRegistrationWizard'
import { useState } from 'react'

interface Props {
  data: RegistrationData
  updateData: (data: Partial<RegistrationData>) => void
  nextStep: () => void
  prevStep: () => void
  currentStep: number
  totalSteps: number
}

const LANGUAGE_VALUES = [
  'English',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Spanish',
  'Arabic',
  'Chinese',
  'Dutch',
  'Greek',
  'Hungarian',
  'Japanese',
  'Polish',
  'Romanian',
  'Turkish',
] as const

export default function LanguagesStep({ data, updateData, nextStep, prevStep, currentStep, totalSteps }: Props) {
  const t = useTranslations('components.modelRegistration.languages')
  const tc = useTranslations('components.modelRegistration.common')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('basic')

  const addLanguage = () => {
    if (selectedLanguage) {
      const newLanguages = [...data.languages, { language: selectedLanguage, level: selectedLevel }]
      updateData({ languages: newLanguages })
      setSelectedLanguage('')
      setSelectedLevel('basic')
    }
  }

  const removeLanguage = (index: number) => {
    const newLanguages = data.languages.filter((_, i) => i !== index)
    updateData({ languages: newLanguages })
  }

  const langLabel = (code: string) => t(`langNames.${code}` as any)

  const levelLabel = (level: string) => {
    if (level === 'basic') return t('basic')
    if (level === 'intermediate') return t('intermediate')
    if (level === 'fluent') return t('fluent')
    if (level === 'native') return t('native')
    return level
  }

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
          <label className="block text-sm mb-2">{t('languagesLabel')}</label>
          <div className="flex gap-2 items-center">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 max-w-xs"
            >
              <option value="">{t('selectLanguage')}</option>
              {LANGUAGE_VALUES.map((lang) => (
                <option key={lang} value={lang}>
                  {langLabel(lang)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addLanguage}
              className="bg-white border-2 border-pink-500 text-pink-600 px-6 py-2 rounded font-semibold hover:bg-pink-50 transition"
            >
              {tc('add')}
            </button>
          </div>
        </div>

        {selectedLanguage && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <label className="block text-sm mb-2">
              {t('levelFor', { language: langLabel(selectedLanguage) })}
            </label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="basic"
                  checked={selectedLevel === 'basic'}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="text-pink-600"
                />
                <span>{t('basic')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="intermediate"
                  checked={selectedLevel === 'intermediate'}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="text-pink-600"
                />
                <span>{t('intermediate')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="fluent"
                  checked={selectedLevel === 'fluent'}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="text-pink-600"
                />
                <span>{t('fluent')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="native"
                  checked={selectedLevel === 'native'}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="text-pink-600"
                />
                <span>{t('native')}</span>
              </label>
            </div>
          </div>
        )}

        {data.languages.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">{t('yourLanguages')}</h3>
            <div className="space-y-2">
              {data.languages.map((lang, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <span>
                    {langLabel(lang.language)} — <span className="text-gray-600">{levelLabel(lang.level)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLanguage(index)}
                    className="text-red-500 hover:text-red-700 font-semibold"
                  >
                    {tc('remove')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
