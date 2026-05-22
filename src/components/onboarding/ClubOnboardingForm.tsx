'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import CitySearch, { type CityResult } from '@/components/ui/CitySearch'
import PhoneInput from '@/components/ui/PhoneInput'

interface ClubFormData {
  club_name: string
  display_name: string
  area: string
  country_code: string
  phone_number: string
  has_viber: boolean
  has_whatsapp: boolean
  has_telegram: boolean
  email: string
  website: string
}

export default function ClubOnboardingForm() {
  const router = useRouter()
  const { refreshProfile } = useAuth()
  const t = useTranslations('onboarding.club')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<ClubFormData>({
    club_name: '',
    display_name: '',
    area: '',
    country_code: '+41',
    phone_number: '',
    has_viber: false,
    has_whatsapp: false,
    has_telegram: false,
    email: '',
    website: '',
  })

  const handleCitySelect = (city: CityResult | null) => {
    handleChange('area', city?.name || '')
  }

  const handleChange = (field: keyof ClubFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.club_name) {
      setError(t('clubNameRequired'))
      return
    }
    if (!formData.phone_number.trim()) {
      setError(t('phoneRequired'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error: detailsError } = await supabase
        .from('club_details')
        .upsert(
          {
            club_id: user.id,
            club_name: formData.club_name,
            display_name: formData.display_name || null,
            area: formData.area || null,
          },
          { onConflict: 'club_id' },
        )

      if (detailsError) throw detailsError

      const { error: contactError } = await supabase
        .from('club_contact_details')
        .upsert({
          club_id: user.id,
          country_code: formData.country_code,
          phone_number: formData.phone_number.trim(),
          has_viber: formData.has_viber,
          has_whatsapp: formData.has_whatsapp,
          has_telegram: formData.has_telegram,
          email: formData.email.trim() || null,
          website: formData.website.trim() || null,
          show_phone_number: true,
        }, { onConflict: 'club_id' })

      if (contactError) throw contactError

      const completeRes = await fetch('/api/onboarding/complete', { method: 'POST' })
      if (!completeRes.ok) {
        const body = await completeRes.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || 'Failed to complete onboarding')
      }

      await refreshProfile()
      router.push('/dashboard/company')
      router.refresh()
    } catch (err: any) {
      console.error('Submission error:', err)
      setError(err.message || t('submissionError'))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50'

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
              {t('header')}
            </p>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              {t('title')}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-gray-600">
              {t('stepOf')}
            </span>
            <div className="mt-1 w-32 bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg mb-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Info Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">{t('infoSection')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('clubName')} <span className="text-pink-600">*</span>
              </label>
              <input
                type="text"
                value={formData.club_name}
                onChange={(e) => handleChange('club_name', e.target.value)}
                placeholder={t('clubNamePlaceholder')}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('displayName')}
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder={t('displayNamePlaceholder')}
                className={inputCls}
              />
            </div>

            <div>
              <CitySearch
                value={formData.area}
                onChange={handleCitySelect}
                label={t('areaLabel')}
                placeholder={t('areaPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Contact Details Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">{t('contactDetails')}</h2>

          <div className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phoneNumber')} <span className="text-pink-600">*</span>
              </label>
              <PhoneInput
                countryCode={formData.country_code}
                phoneNumber={formData.phone_number}
                onCountryCodeChange={(v) => handleChange('country_code', v)}
                onPhoneNumberChange={(v) => handleChange('phone_number', v)}
                placeholder={t('phonePlaceholder')}
                required
              />
            </div>

            {/* Messaging apps */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">{t('availableOn')}</p>
              <div className="flex flex-wrap gap-3">
                {([
                  { label: 'WhatsApp', field: 'has_whatsapp' as const, color: 'bg-green-100 text-green-700 border-green-300' },
                  { label: 'Viber', field: 'has_viber' as const, color: 'bg-purple-100 text-purple-700 border-purple-300' },
                  { label: 'Telegram', field: 'has_telegram' as const, color: 'bg-blue-100 text-blue-700 border-blue-300' },
                ]).map(({ label, field, color }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleChange(field, !formData[field])}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      formData[field] ? color : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {label} {formData[field] ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Email & Website */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email')} <span className="text-gray-400 font-normal">{t('optional')}</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('website')} <span className="text-gray-400 font-normal">{t('optional')}</span>
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder={t('websitePlaceholder')}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">{t('tipLabel')}</span> {t('tip')}
          </p>
        </div>

        {/* Submit */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={loading || !formData.club_name || !formData.phone_number.trim()}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('saving') : t('finish')}
          </button>
        </div>
      </form>
    </div>
  )
}
