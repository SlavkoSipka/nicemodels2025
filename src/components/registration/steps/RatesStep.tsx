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

const DURATION_OPTIONS: { value: string; msgKey: string }[] = [
  { value: '15 minutes', msgKey: 'm15' },
  { value: '30 minutes', msgKey: 'm30' },
  { value: '1 hour', msgKey: 'h1' },
  { value: '2 hours', msgKey: 'h2' },
  { value: '3 hours', msgKey: 'h3' },
  { value: '4 hours', msgKey: 'h4' },
  { value: 'Overnight', msgKey: 'overnight' },
  { value: 'Full day', msgKey: 'fullday' },
]

export default function RatesStep({ data, updateData, nextStep, prevStep, currentStep, totalSteps }: Props) {
  const t = useTranslations('components.modelRegistration.rates')
  const tc = useTranslations('components.modelRegistration.common')
  const [incallDuration, setIncallDuration] = useState('1 hour')
  const [incallPrice, setIncallPrice] = useState('')
  const [outcallDuration, setOutcallDuration] = useState('1 hour')
  const [outcallPrice, setOutcallPrice] = useState('')

  const durLabel = (msgKey: string) => t(`durations.${msgKey}` as 'durations.h1')

  const addIncallRate = () => {
    if (incallPrice) {
      const newRates = [...data.incallRates, { duration: incallDuration, price: incallPrice, currency: 'CHF' }]
      updateData({ incallRates: newRates })
      setIncallPrice('')
    }
  }

  const addOutcallRate = () => {
    if (outcallPrice) {
      const newRates = [...data.outcallRates, { duration: outcallDuration, price: outcallPrice, currency: 'CHF' }]
      updateData({ outcallRates: newRates })
      setOutcallPrice('')
    }
  }

  const removeIncallRate = (index: number) => {
    const newRates = data.incallRates.filter((_, i) => i !== index)
    updateData({ incallRates: newRates })
  }

  const removeOutcallRate = (index: number) => {
    const newRates = data.outcallRates.filter((_, i) => i !== index)
    updateData({ outcallRates: newRates })
  }

  const formatDuration = (stored: string) => {
    const opt = DURATION_OPTIONS.find((o) => o.value === stored)
    return opt ? durLabel(opt.msgKey) : stored
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
        <h3 className="font-semibold mb-6">{t('rate')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold mb-4">{t('incallRates')}</h4>

            <div className="mb-4">
              <label className="block text-sm mb-2">
                {t('duration')} <span className="text-red-500">*</span>
              </label>
              <select
                value={incallDuration}
                onChange={(e) => setIncallDuration(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {DURATION_OPTIONS.map(({ value, msgKey }) => (
                  <option key={value} value={value}>
                    {durLabel(msgKey)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2">{t('price')}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="0"
                  value={incallPrice}
                  onChange={(e) => setIncallPrice(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <span className="flex items-center px-4 border border-gray-300 rounded bg-gray-50">CHF</span>
                <button
                  type="button"
                  onClick={addIncallRate}
                  className="bg-white border-2 border-pink-500 text-pink-600 px-6 py-2 rounded font-semibold hover:bg-pink-50 transition"
                >
                  {tc('add')}
                </button>
              </div>
            </div>

            {data.incallRates.length === 0 ? (
              <p className="text-gray-500 text-sm italic">{t('noRates')}</p>
            ) : (
              <div className="space-y-2">
                {data.incallRates.map((rate, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <span>
                      {formatDuration(rate.duration)}: {rate.price} {rate.currency}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeIncallRate(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      {tc('remove')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('outcallRates')}</h4>

            <div className="mb-4">
              <label className="block text-sm mb-2">
                {t('duration')} <span className="text-red-500">*</span>
              </label>
              <select
                value={outcallDuration}
                onChange={(e) => setOutcallDuration(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {DURATION_OPTIONS.map(({ value, msgKey }) => (
                  <option key={value} value={value}>
                    {durLabel(msgKey)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2">{t('price')}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="0"
                  value={outcallPrice}
                  onChange={(e) => setOutcallPrice(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <span className="flex items-center px-4 border border-gray-300 rounded bg-gray-50">CHF</span>
                <button
                  type="button"
                  onClick={addOutcallRate}
                  className="bg-white border-2 border-pink-500 text-pink-600 px-6 py-2 rounded font-semibold hover:bg-pink-50 transition"
                >
                  {tc('add')}
                </button>
              </div>
            </div>

            {data.outcallRates.length === 0 ? (
              <p className="text-gray-500 text-sm italic">{t('noRates')}</p>
            ) : (
              <div className="space-y-2">
                {data.outcallRates.map((rate, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <span>
                      {formatDuration(rate.duration)}: {rate.price} {rate.currency}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeOutcallRate(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      {tc('remove')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={nextStep}
          className="mt-8 bg-gradient-to-r from-pink-600 to-pink-500 text-white px-8 py-3 rounded font-semibold hover:from-pink-700 hover:to-pink-600 transition"
        >
          {tc('nextStep')}
        </button>
      </div>
    </div>
  )
}
