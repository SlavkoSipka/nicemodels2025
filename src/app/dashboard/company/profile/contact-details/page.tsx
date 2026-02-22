'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Phone, Save, AlertCircle, MapPin, Mail, Globe } from 'lucide-react'

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
  const [cities, setCities] = useState<any[]>([])

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

      // Load cities
      const { data: citiesData } = await supabase
        .from('cities')
        .select('id, name, canton')
        .eq('is_active', true)
        .order('display_order')

      if (citiesData) {
        setCities(citiesData)
      }

      // Load existing club contact details
      const { data: contactData } = await supabase
        .from('club_contact_details')
        .select('*')
        .eq('club_id', user.id)
        .single()

      // Load existing club details for address
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
          hide_contact_info: false // This field doesn't exist in schema yet
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

      // Update contact details in club_contact_details table
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
        }, {
          onConflict: 'club_id'
        })

      if (contactError) throw contactError

      // Update address in club_details table
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

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 rounded-lg p-2">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Contact Details</h1>
            </div>
            <p className="text-gray-600">Manage how clients can reach you and your location</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Phone Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-pink-600" />
                Phone Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Country Code</label>
                  <input
                    type="text"
                    value={formData.country_code}
                    onChange={(e) => handleChange('country_code', e.target.value)}
                    placeholder="+41"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => handleChange('phone_number', e.target.value)}
                    placeholder="79 123 45 67"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Messaging Apps */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-3">Available on:</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_viber}
                      onChange={(e) => handleChange('has_viber', e.target.checked)}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Viber</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_whatsapp}
                      onChange={(e) => handleChange('has_whatsapp', e.target.checked)}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_telegram}
                      onChange={(e) => handleChange('has_telegram', e.target.checked)}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Telegram</span>
                  </label>
                </div>
              </div>

              {/* Contact Instruction */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Preference</label>
                <select
                  value={formData.contact_instruction}
                  onChange={(e) => handleChange('contact_instruction', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {CONTACT_INSTRUCTION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* No Withheld Numbers */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                <input
                  type="checkbox"
                  checked={formData.no_withheld_numbers}
                  onChange={(e) => handleChange('no_withheld_numbers', e.target.checked)}
                  className="mt-1 w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    No withheld numbers
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Don't accept calls from hidden/private numbers
                  </p>
                </div>
              </div>

              {/* Other Instructions */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Other Instructions</label>
                <textarea
                  value={formData.other_instructions}
                  onChange={(e) => handleChange('other_instructions', e.target.value)}
                  rows={3}
                  placeholder="Any additional contact instructions..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Online Contact Section */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-pink-600" />
                Online Contact
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="info@yourclub.ch"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://www.yourclub.ch"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-pink-600" />
                Physical Location
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Street</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => handleChange('street', e.target.value)}
                      placeholder="Bahnhofstrasse"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Number</label>
                    <input
                      type="text"
                      value={formData.street_number}
                      onChange={(e) => handleChange('street_number', e.target.value)}
                      placeholder="123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Additional Info</label>
                  <input
                    type="text"
                    value={formData.additional_info}
                    onChange={(e) => handleChange('additional_info', e.target.value)}
                    placeholder="Floor, apartment number, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">City</label>
                    <select
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Select city...</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name} ({city.canton})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => handleChange('zip_code', e.target.value)}
                      placeholder="8001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <input
                  type="checkbox"
                  checked={formData.hide_contact_info}
                  onChange={(e) => handleChange('hide_contact_info', e.target.checked)}
                  className="mt-1 w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    Hide contact information from public
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    When enabled, clients must contact you through our internal messaging system
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => router.push('/dashboard/company')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}
