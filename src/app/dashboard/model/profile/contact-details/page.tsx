'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const COUNTRY_CODES = [
  { label: 'Switzerland (+41)', value: '+41' },
  { label: 'Germany (+49)', value: '+49' },
  { label: 'Austria (+43)', value: '+43' },
  { label: 'Italy (+39)', value: '+39' },
  { label: 'France (+33)', value: '+33' },
  { label: 'United Kingdom (+44)', value: '+44' },
  { label: 'USA/Canada (+1)', value: '+1' },
  { label: 'Czech Republic (+420)', value: '+420' },
  { label: 'Poland (+48)', value: '+48' },
  { label: 'Russia (+7)', value: '+7' },
  { label: 'Ukraine (+380)', value: '+380' },
  { label: 'Romania (+40)', value: '+40' },
]

export default function ContactDetailsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [showPhoneNumber, setShowPhoneNumber] = useState(false)
  const [countryCode, setCountryCode] = useState('+41')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [hasViber, setHasViber] = useState(false)
  const [hasWhatsapp, setHasWhatsapp] = useState(false)
  const [hasTelegram, setHasTelegram] = useState(false)
  const [contactInstruction, setContactInstruction] = useState<'sms_and_call' | 'sms_only' | 'no_sms'>('sms_and_call')
  const [noWithheldNumbers, setNoWithheldNumbers] = useState(false)
  const [otherInstructions, setOtherInstructions] = useState('')

  useEffect(() => {
    loadContactDetails()
  }, [])

  const loadContactDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('model_contact_details')
        .select('*')
        .eq('model_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setShowPhoneNumber(data.show_phone_number || false)
        setCountryCode(data.country_code || '+41')
        setPhoneNumber(data.phone_number || '')
        setHasViber(data.has_viber || false)
        setHasWhatsapp(data.has_whatsapp || false)
        setHasTelegram(data.has_telegram || false)
        setContactInstruction(data.contact_instruction || 'sms_and_call')
        setNoWithheldNumbers(data.no_withheld_numbers || false)
        setOtherInstructions(data.other_instructions || '')
      }
    } catch (err: any) {
      console.error('Error loading contact details:', err)
      setError('Failed to load contact details')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess(false)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const contactData = {
        model_id: user.id,
        show_phone_number: showPhoneNumber,
        country_code: countryCode,
        phone_number: phoneNumber,
        has_viber: hasViber,
        has_whatsapp: hasWhatsapp,
        has_telegram: hasTelegram,
        contact_instruction: contactInstruction,
        no_withheld_numbers: noWithheldNumbers,
        other_instructions: otherInstructions,
        updated_at: new Date().toISOString()
      }

      const { error: upsertError } = await supabase
        .from('model_contact_details')
        .upsert(contactData, {
          onConflict: 'model_id'
        })

      if (upsertError) throw upsertError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error saving contact details:', err)
      setError(err.message || 'Failed to save contact details')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 ml-[280px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
      <div className="flex-1 p-8 ml-[280px]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Contact Details</h1>
            <p className="text-gray-600 mt-2">Manage your contact information and preferences</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Contact details saved successfully!
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
            {/* Show Phone Number */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPhoneNumber}
                  onChange={(e) => setShowPhoneNumber(e.target.checked)}
                  className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-base font-medium text-gray-900">Show phone number</span>
              </label>
            </div>

            {/* Country Code & Phone Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country Code <span className="text-red-500">*</span>
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Please provide the country calling code if you use a non-Swiss number
                </p>
              </div>
            </div>

            {/* Messaging Apps */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setHasViber(!hasViber)}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    hasViber
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-300'
                  }`}
                >
                  {hasViber && '✓ '}Viber
                </button>

                <button
                  type="button"
                  onClick={() => setHasWhatsapp(!hasWhatsapp)}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    hasWhatsapp
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-300'
                  }`}
                >
                  {hasWhatsapp && '✓ '}WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setHasTelegram(!hasTelegram)}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    hasTelegram
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {hasTelegram && '✓ '}Telegram
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Instructions
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setContactInstruction('sms_and_call')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    contactInstruction === 'sms_and_call'
                      ? 'bg-pink-600 text-white'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-pink-300'
                  }`}
                >
                  SMS and Call
                </button>

                <button
                  type="button"
                  onClick={() => setContactInstruction('sms_only')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    contactInstruction === 'sms_only'
                      ? 'bg-pink-600 text-white'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-pink-300'
                  }`}
                >
                  SMS Only
                </button>

                <button
                  type="button"
                  onClick={() => setContactInstruction('no_sms')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    contactInstruction === 'no_sms'
                      ? 'bg-pink-600 text-white'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-pink-300'
                  }`}
                >
                  No SMS
                </button>
              </div>
            </div>

            {/* No Withheld Numbers */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noWithheldNumbers}
                  onChange={(e) => setNoWithheldNumbers(e.target.checked)}
                  className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-base font-medium text-gray-900">No Withheld Numbers</span>
              </label>
            </div>

            {/* Other Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other
              </label>
              <textarea
                value={otherInstructions}
                onChange={(e) => setOtherInstructions(e.target.value)}
                placeholder="Additional instructions..."
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto px-8 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}
