'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Phone, Save, CheckCircle, AlertCircle } from 'lucide-react'

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
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const { data, error: e } = await supabase.from('model_contact_details').select('*').eq('model_id', user.id).single()
        if (e && e.code !== 'PGRST116') throw e
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
        setError('Failed to load contact details')
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true); setError(''); setSuccess(false)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: e } = await supabase.from('model_contact_details').upsert({
        model_id: user.id, show_phone_number: showPhoneNumber, country_code: countryCode,
        phone_number: phoneNumber, has_viber: hasViber, has_whatsapp: hasWhatsapp,
        has_telegram: hasTelegram, contact_instruction: contactInstruction,
        no_withheld_numbers: noWithheldNumbers, other_instructions: otherInstructions,
        updated_at: new Date().toISOString()
      }, { onConflict: 'model_id' })
      if (e) throw e
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save contact details')
    } finally { setSaving(false) }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand'
  const toggleBtn = (active: boolean, color?: string) =>
    `px-3 py-2 text-sm rounded-lg border transition-colors font-medium ${active
      ? (color || 'border-brand bg-brand/10 text-brand')
      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Contact Details</h1>
              <p className="text-xs text-gray-500">Manage your contact information and preferences</p>
            </div>
          </div>
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">Contact details saved successfully!</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
          {/* Show phone toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showPhoneNumber} onChange={e => setShowPhoneNumber(e.target.checked)}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand" />
            <span className="text-sm font-semibold text-gray-900">Show phone number on profile</span>
          </label>

          {/* Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">Country Code <span className="text-red-500">*</span></label>
              <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className={inputCls}>
                {COUNTRY_CODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">Phone Number <span className="text-red-500">*</span></label>
              <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number" className={inputCls} />
            </div>
          </div>

          {/* Messaging apps */}
          <div>
            <p className="text-xs font-bold text-gray-800 mb-2">Available on</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setHasViber(!hasViber)}
                className={toggleBtn(hasViber, 'border-purple-400 bg-purple-50 text-purple-700')}>
                {hasViber && '✓ '}Viber
              </button>
              <button type="button" onClick={() => setHasWhatsapp(!hasWhatsapp)}
                className={toggleBtn(hasWhatsapp, 'border-green-400 bg-green-50 text-green-700')}>
                {hasWhatsapp && '✓ '}WhatsApp
              </button>
              <button type="button" onClick={() => setHasTelegram(!hasTelegram)}
                className={toggleBtn(hasTelegram, 'border-blue-400 bg-blue-50 text-blue-700')}>
                {hasTelegram && '✓ '}Telegram
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <p className="text-xs font-bold text-gray-800 mb-2">Contact Preference</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'sms_and_call', label: 'SMS & Call' },
                { value: 'sms_only', label: 'SMS Only' },
                { value: 'no_sms', label: 'No SMS' }
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setContactInstruction(opt.value as any)}
                  className={toggleBtn(contactInstruction === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* No withheld numbers */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={noWithheldNumbers} onChange={e => setNoWithheldNumbers(e.target.checked)}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand" />
            <span className="text-sm font-semibold text-gray-900">No withheld numbers</span>
          </label>

          {/* Other instructions */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">Other instructions</label>
            <textarea value={otherInstructions} onChange={e => setOtherInstructions(e.target.value)}
              placeholder="Additional instructions..." rows={3}
              className={inputCls + ' resize-none'} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pb-2">
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
