'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Phone, Save, AlertCircle, CheckCircle } from 'lucide-react'
import CitySearch, { type CityResult } from '@/components/ui/CitySearch'

interface FormData {
  country_code: string
  phone_number: string
  has_viber: boolean
  has_whatsapp: boolean
  has_telegram: boolean
  contact_instruction: string
  no_withheld_numbers: boolean
  other_instructions: string
  email: string
  website: string
  street: string
  street_number: string
  additional_info: string
  city: string
  zip_code: string
  hide_contact_info: boolean
}

const CONTACT_INSTRUCTION_OPTIONS = [
  { value: 'sms_and_call', label: 'SMS and Call' },
  { value: 'sms_only', label: 'SMS only' },
  { value: 'call_only', label: 'Call only' }
]

export default function ContactDetailsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState<FormData>({
    country_code: '+41',
    phone_number: '',
    has_viber: false,
    has_whatsapp: false,
    has_telegram: false,
    contact_instruction: 'sms_and_call',
    no_withheld_numbers: false,
    other_instructions: '',
    email: '',
    website: '',
    street: '',
    street_number: '',
    additional_info: '',
    city: '',
    zip_code: '',
    hide_contact_info: false
  })

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: contactData } = await supabase
        .from('club_contact_details')
        .select('*')
        .eq('club_id', user.id)
        .single()

      const { data: clubData } = await supabase
        .from('club_details')
        .select('city, zip_code, street, street_number, additional_info')
        .eq('club_id', user.id)
        .single()

      if (contactData || clubData) {
        setFormData({
          country_code: contactData?.country_code || '+41',
          phone_number: contactData?.phone_number || '',
          has_viber: contactData?.has_viber || false,
          has_whatsapp: contactData?.has_whatsapp || false,
          has_telegram: contactData?.has_telegram || false,
          contact_instruction: contactData?.contact_instruction || 'sms_and_call',
          no_withheld_numbers: contactData?.no_withheld_numbers || false,
          other_instructions: contactData?.other_instructions || '',
          email: contactData?.email || '',
          website: contactData?.website || '',
          street: clubData?.street || '',
          street_number: clubData?.street_number || '',
          additional_info: clubData?.additional_info || '',
          city: clubData?.city || '',
          zip_code: clubData?.zip_code || '',
          hide_contact_info: false
        })
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const supabase = createClient()

      const { error: contactError } = await supabase
        .from('club_contact_details')
        .upsert({
          club_id: user.id,
          country_code: formData.country_code,
          phone_number: formData.phone_number,
          has_viber: formData.has_viber,
          has_whatsapp: formData.has_whatsapp,
          has_telegram: formData.has_telegram,
          contact_instruction: formData.contact_instruction,
          no_withheld_numbers: formData.no_withheld_numbers,
          other_instructions: formData.other_instructions,
          email: formData.email,
          website: formData.website,
          updated_at: new Date().toISOString()
        }, { onConflict: 'club_id' })

      if (contactError) throw contactError

      const { error: addressError } = await supabase
        .from('club_details')
        .update({
          street: formData.street,
          street_number: formData.street_number,
          additional_info: formData.additional_info,
          city: formData.city,
          zip_code: formData.zip_code,
          updated_at: new Date().toISOString()
        })
        .eq('club_id', user.id)

      if (addressError) throw addressError

      setSuccess('Contact details updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header — dashboard style */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <Phone className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Contact Details</h1>
            <p className="text-xs text-gray-500">Manage how clients can reach you and your location</p>
          </div>
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
            <p className="text-sm text-emerald-800">{success}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          {/* Phone */}
          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">Phone Information</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Country Code</label>
                <input
                  type="text"
                  value={formData.country_code}
                  onChange={(e) => handleChange('country_code', e.target.value)}
                  placeholder="+41"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  placeholder="79 123 45 67"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <span className="text-xs font-medium text-gray-600">Available on:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_viber}
                  onChange={(e) => handleChange('has_viber', e.target.checked)}
                  className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                />
                <span className="text-sm text-gray-700">Viber</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_whatsapp}
                  onChange={(e) => handleChange('has_whatsapp', e.target.checked)}
                  className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                />
                <span className="text-sm text-gray-700">WhatsApp</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_telegram}
                  onChange={(e) => handleChange('has_telegram', e.target.checked)}
                  className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                />
                <span className="text-sm text-gray-700">Telegram</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Preference</label>
                <select
                  value={formData.contact_instruction}
                  onChange={(e) => handleChange('contact_instruction', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {CONTACT_INSTRUCTION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 py-1.5 mb-3">
              <input
                type="checkbox"
                id="no_withheld"
                checked={formData.no_withheld_numbers}
                onChange={(e) => handleChange('no_withheld_numbers', e.target.checked)}
                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
              />
              <label htmlFor="no_withheld" className="text-sm text-gray-700">No withheld numbers (don't accept hidden/private)</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Other Instructions</label>
              <textarea
                value={formData.other_instructions}
                onChange={(e) => handleChange('other_instructions', e.target.value)}
                rows={2}
                placeholder="Any additional contact instructions..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Online Contact */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-800 mb-3">Online Contact</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="info@yourclub.ch"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://www.yourclub.ch"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-800 mb-3">Physical Location</p>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Street</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleChange('street', e.target.value)}
                    placeholder="Bahnhofstrasse"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Number</label>
                  <input
                    type="text"
                    value={formData.street_number}
                    onChange={(e) => handleChange('street_number', e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Additional Info</label>
                <input
                  type="text"
                  value={formData.additional_info}
                  onChange={(e) => handleChange('additional_info', e.target.value)}
                  placeholder="Floor, apartment number, etc."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <CitySearch
                    value={formData.city}
                    postalCode={formData.zip_code}
                    onChange={(city) => {
                      if (city) {
                        handleChange('city', city.name)
                        if (city.postal_code) handleChange('zip_code', city.postal_code)
                      } else {
                        handleChange('city', '')
                        handleChange('zip_code', '')
                      }
                    }}
                    label="City"
                    placeholder="Search city or PLZ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => handleChange('zip_code', e.target.value)}
                    placeholder="Auto-filled from city"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 py-1.5">
              <input
                type="checkbox"
                id="hide_contact"
                checked={formData.hide_contact_info}
                onChange={(e) => handleChange('hide_contact_info', e.target.checked)}
                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
              />
              <label htmlFor="hide_contact" className="text-sm text-gray-700">
                Hide contact information from public (clients contact via internal messaging)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => router.push('/dashboard/company')}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
