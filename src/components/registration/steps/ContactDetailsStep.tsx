'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft } from 'lucide-react'
import { RegistrationData } from '../ModelRegistrationWizard'
import { useState, useEffect } from 'react'

interface Props {
  data: RegistrationData
  updateData: (data: Partial<RegistrationData>) => void
  nextStep: () => void
  prevStep: () => void
  currentStep: number
  totalSteps: number
}

export default function ContactDetailsStep({ data, updateData, nextStep, prevStep, currentStep, totalSteps }: Props) {
  const t = useTranslations('components.modelRegistration.contactDetails')
  const tc = useTranslations('components.modelRegistration.common')
  const [otherNotes, setOtherNotes] = useState(
    ['sms_and_call', 'sms_only', 'no_sms'].includes(data.contactInstructions) ? '' : data.contactInstructions
  )

  useEffect(() => {
    if (['sms_and_call', 'sms_only', 'no_sms'].includes(data.contactInstructions)) {
      setOtherNotes('')
    } else {
      setOtherNotes(data.contactInstructions)
    }
  }, [data.contactInstructions])

  const toggleMessenger = (messenger: 'viber' | 'whatsapp' | 'telegram') => {
    updateData({ [messenger]: !data[messenger] })
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
        <h3 className="font-semibold mb-4">
          {t('phoneHeading')} <span className="text-red-500">*</span>
        </h3>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showPhoneNumber}
              onChange={(e) => updateData({ showPhoneNumber: e.target.checked })}
              className="w-5 h-5 text-pink-600"
            />
            <span className="text-blue-600">{t('showPhone')}</span>
          </label>
        </div>

        <div className="grid grid-cols-[110px_1fr] md:grid-cols-2 gap-3 md:gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2">{t('countryCode')}</label>
            <select
              value={data.countryCode}
              onChange={(e) => updateData({ countryCode: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="+41">{t('codes.ch')}</option>
              <option value="+49">{t('codes.de')}</option>
              <option value="+43">{t('codes.at')}</option>
              <option value="+33">{t('codes.fr')}</option>
              <option value="+39">{t('codes.it')}</option>
              <option value="+34">{t('codes.es')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">
              {t('phoneNumber')} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder={t('phonePlaceholder')}
              value={data.phoneNumber}
              onChange={(e) => updateData({ phoneNumber: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <p className="text-xs text-gray-500 mt-1">{t('phoneHint')}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => toggleMessenger('viber')}
            className={`px-6 py-2 rounded-full border transition ${
              data.viber
                ? 'bg-purple-100 border-purple-500 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300'
            }`}
          >
            ✓ {t('viber')}
          </button>
          <button
            type="button"
            onClick={() => toggleMessenger('whatsapp')}
            className={`px-6 py-2 rounded-full border transition ${
              data.whatsapp
                ? 'bg-green-100 border-green-500 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
            }`}
          >
            ✓ {t('whatsapp')}
          </button>
          <button
            type="button"
            onClick={() => toggleMessenger('telegram')}
            className={`px-6 py-2 rounded-full border transition ${
              data.telegram
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
            }`}
          >
            ✓ {t('telegram')}
          </button>
        </div>

        <h3 className="font-semibold mb-4 mt-8">{t('instructions')}</h3>
        <div className="flex gap-4 mb-4 flex-wrap">
          <button
            type="button"
            onClick={() => updateData({ contactInstructions: 'sms_and_call' })}
            className={`px-6 py-2 rounded-full border transition ${
              data.contactInstructions === 'sms_and_call'
                ? 'bg-pink-100 border-pink-500 text-pink-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            {t('smsAndCall')}
          </button>
          <button
            type="button"
            onClick={() => updateData({ contactInstructions: 'sms_only' })}
            className={`px-6 py-2 rounded-full border transition ${
              data.contactInstructions === 'sms_only'
                ? 'bg-pink-100 border-pink-500 text-pink-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            {t('smsOnly')}
          </button>
          <button
            type="button"
            onClick={() => updateData({ contactInstructions: 'no_sms' })}
            className={`px-6 py-2 rounded-full border transition ${
              data.contactInstructions === 'no_sms'
                ? 'bg-pink-100 border-pink-500 text-pink-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            {t('noSms')}
          </button>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.noWithheldNumbers}
              onChange={(e) => updateData({ noWithheldNumbers: e.target.checked })}
              className="w-5 h-5 text-pink-600"
            />
            <span>{t('noWithheld')}</span>
          </label>
        </div>

        <div className="mb-6">
          <textarea
            placeholder={t('otherPlaceholder')}
            value={otherNotes}
            onChange={(e) => {
              const v = e.target.value
              setOtherNotes(v)
              updateData({ contactInstructions: v })
            }}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <h3 className="font-semibold mb-4 mt-8">{t('web')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder={t('skypePh')}
              value={data.skypeId}
              onChange={(e) => updateData({ skypeId: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('videogirlsPh')}
              value={data.videogirlsUrl}
              onChange={(e) => updateData({ videogirlsUrl: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button type="button" className="bg-gray-800 text-white px-4 rounded hover:bg-gray-900 transition">
              {t('vg')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <input
              type="email"
              placeholder={t('emailPh')}
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <input
              type="url"
              placeholder={t('websitePh')}
              value={data.website}
              onChange={(e) => updateData({ website: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
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
