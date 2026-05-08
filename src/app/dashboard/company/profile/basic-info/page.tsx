'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Save, AlertCircle, CheckCircle, Phone, MapPin } from 'lucide-react'
import RichTextEditor from '@/components/ui/RichTextEditor'
import CitySearch from '@/components/ui/CitySearch'

const ENTRANCE_FEE_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'free', label: 'Free' },
  { value: 'with_cost', label: 'With cost' },
]

const WELLNESS_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const FOOD_DRINKS_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const OUTDOOR_AREA_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

type ContactMethod = 'call' | 'sms' | 'whatsapp' | 'viber' | 'telegram' | 'email'

const CONTACT_METHOD_OPTIONS: Array<{
  id: ContactMethod
  label: string
  helper: string
  needsPhone: boolean
  needsEmail: boolean
  swatch: string
}> = [
  { id: 'call',     label: 'Phone call', helper: 'Clients can tap to call your number',     needsPhone: true,  needsEmail: false, swatch: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'sms',      label: 'SMS',        helper: 'Clients can tap to send an SMS',          needsPhone: true,  needsEmail: false, swatch: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'whatsapp', label: 'WhatsApp',   helper: 'Open WhatsApp chat with your number',     needsPhone: true,  needsEmail: false, swatch: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'viber',    label: 'Viber',      helper: 'Open Viber chat with your number',        needsPhone: true,  needsEmail: false, swatch: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'telegram', label: 'Telegram',   helper: 'Open Telegram chat with your number',     needsPhone: true,  needsEmail: false, swatch: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'email',    label: 'Email',      helper: 'Clients can tap to compose an email',     needsPhone: false, needsEmail: true,  swatch: 'bg-rose-100 text-rose-700 border-rose-200' },
]

interface FormData {
  // Basic identity / amenities (club_details)
  club_name: string
  display_name: string
  about_description: string
  is_club: boolean
  entrance_fee: string
  wellness: string
  food_and_drinks: string
  outdoor_area: string
  // Address (club_details)
  street: string
  street_number: string
  additional_info: string
  city: string
  zip_code: string
  // Contact (club_contact_details)
  country_code: string
  phone_number: string
  contact_methods: ContactMethod[]
  no_withheld_numbers: boolean
  other_instructions: string
  email: string
  website: string
  hide_contact_info: boolean
}

export default function BasicInfoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)
  const maxChars = 3000

  const [formData, setFormData] = useState<FormData>({
    club_name: '',
    display_name: '',
    about_description: '',
    is_club: false,
    entrance_fee: 'na',
    wellness: 'na',
    food_and_drinks: 'na',
    outdoor_area: 'na',
    street: '',
    street_number: '',
    additional_info: '',
    city: '',
    zip_code: '',
    country_code: '+41',
    phone_number: '',
    contact_methods: [],
    no_withheld_numbers: false,
    other_instructions: '',
    email: '',
    website: '',
    hide_contact_info: false,
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

      const [{ data: clubData }, { data: contactData }] = await Promise.all([
        supabase.from('club_details').select('*').eq('club_id', user.id).single(),
        supabase.from('club_contact_details').select('*').eq('club_id', user.id).single(),
      ])

      // Derive contact methods from new column or fall back to legacy flags.
      let methods: ContactMethod[] = Array.isArray(contactData?.contact_methods)
        ? (contactData!.contact_methods as ContactMethod[])
        : []
      if (methods.length === 0 && contactData) {
        const phone = (contactData.phone_number || '').trim()
        const inst = contactData.contact_instruction || ''
        if (phone && (inst === 'sms_and_call' || inst === 'call_only')) methods.push('call')
        if (phone && (inst === 'sms_and_call' || inst === 'sms_only')) methods.push('sms')
        if (phone && contactData.has_whatsapp) methods.push('whatsapp')
        if (phone && contactData.has_viber)    methods.push('viber')
        if (phone && contactData.has_telegram) methods.push('telegram')
        if (contactData.email) methods.push('email')
      }

      setFormData({
        club_name: clubData?.club_name || '',
        display_name: clubData?.display_name || '',
        about_description: clubData?.about_description || '',
        is_club: clubData?.is_club || false,
        entrance_fee: clubData?.entrance_fee || 'na',
        wellness: clubData?.wellness || 'na',
        food_and_drinks: clubData?.food_and_drinks || 'na',
        outdoor_area: clubData?.outdoor_area || 'na',
        street: clubData?.street || '',
        street_number: clubData?.street_number || '',
        additional_info: clubData?.additional_info || '',
        city: clubData?.city || '',
        zip_code: clubData?.zip_code || '',
        country_code: contactData?.country_code || '+41',
        phone_number: contactData?.phone_number || '',
        contact_methods: methods,
        no_withheld_numbers: contactData?.no_withheld_numbers || false,
        other_instructions: contactData?.other_instructions || '',
        email: contactData?.email || '',
        website: contactData?.website || '',
        hide_contact_info: contactData?.hide_contact_info || false,
      })

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

    if (!formData.club_name.trim()) {
      setError('Club name is required')
      return
    }
    if (!formData.display_name.trim()) {
      setError('Display name is required')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      const { error: clubErr } = await supabase
        .from('club_details')
        .update({
          club_name: formData.club_name,
          display_name: formData.display_name,
          about_description: formData.about_description,
          is_club: formData.is_club,
          entrance_fee: formData.entrance_fee,
          wellness: formData.wellness,
          food_and_drinks: formData.food_and_drinks,
          outdoor_area: formData.outdoor_area,
          street: formData.street,
          street_number: formData.street_number,
          additional_info: formData.additional_info,
          city: formData.city,
          zip_code: formData.zip_code,
          updated_at: new Date().toISOString(),
        })
        .eq('club_id', user.id)
      if (clubErr) throw clubErr

      // Mirror selection back to legacy fields so older code paths keep working.
      const m = new Set(formData.contact_methods)
      const hasCall = m.has('call')
      const hasSms = m.has('sms')
      const legacyInstruction = hasCall && hasSms
        ? 'sms_and_call'
        : hasCall ? 'call_only'
        : hasSms  ? 'sms_only'
        : 'sms_and_call'

      const { error: contactErr } = await supabase
        .from('club_contact_details')
        .upsert({
          club_id: user.id,
          country_code: formData.country_code,
          phone_number: formData.phone_number,
          contact_methods: formData.contact_methods,
          has_whatsapp: m.has('whatsapp'),
          has_viber:    m.has('viber'),
          has_telegram: m.has('telegram'),
          contact_instruction: legacyInstruction,
          no_withheld_numbers: formData.no_withheld_numbers,
          other_instructions: formData.other_instructions,
          email: formData.email,
          website: formData.website,
          hide_contact_info: formData.hide_contact_info,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'club_id' })
      if (contactErr) throw contactErr

      setSuccess('Basic info updated successfully!')
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
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Basic Info</h1>
            <p className="text-xs text-gray-500">
              Manage your club&apos;s identity, contact, location, and amenities — all in one place
            </p>
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

        {/* SECTION 1: Identity */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand" />
            <p className="text-sm font-bold text-gray-800">Identity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Club Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.club_name}
                onChange={(e) => handleChange('club_name', e.target.value)}
                placeholder="Official name"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="How your club appears to visitors"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>

          <RichTextEditor
            value={formData.about_description}
            onChange={(val) => handleChange('about_description', val)}
            label="About Your Club"
            placeholder="Describe your club, services, atmosphere..."
            maxLength={maxChars}
            height={250}
          />

          <div className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              id="is_club"
              checked={formData.is_club}
              onChange={(e) => handleChange('is_club', e.target.checked)}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <label htmlFor="is_club" className="text-sm text-gray-700">
              This is a physical club/venue (nightclub, gentlemen&apos;s club, etc.)
            </label>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-800 mb-2">Amenities &amp; Features</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Entrance</label>
                <select
                  value={formData.entrance_fee}
                  onChange={(e) => handleChange('entrance_fee', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {ENTRANCE_FEE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Wellness</label>
                <select
                  value={formData.wellness}
                  onChange={(e) => handleChange('wellness', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {WELLNESS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Food &amp; Drinks</label>
                <select
                  value={formData.food_and_drinks}
                  onChange={(e) => handleChange('food_and_drinks', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {FOOD_DRINKS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Outdoor</label>
                <select
                  value={formData.outdoor_area}
                  onChange={(e) => handleChange('outdoor_area', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {OUTDOOR_AREA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Contact details */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-brand" />
            <p className="text-sm font-bold text-gray-800">Contact Details</p>
          </div>

          {/* Phone */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">Phone number</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          </div>

          {/* Email + Website */}
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

          {/* Available contact methods (multi-checkbox) */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-700">Available contact methods</p>
            <p className="text-[11px] text-gray-500 mb-3">
              Choose which channels appear as clickable buttons on your public club page.
              Methods that need a phone number or email are auto-disabled if those fields are empty.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONTACT_METHOD_OPTIONS.map(opt => {
                const phone = formData.phone_number.trim()
                const email = formData.email.trim()
                const blocked =
                  (opt.needsPhone && !phone) ||
                  (opt.needsEmail && !email)
                const checked = formData.contact_methods.includes(opt.id)
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? `${opt.swatch} border-current/40`
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    } ${blocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      disabled={blocked}
                      checked={checked && !blocked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...formData.contact_methods, opt.id]
                          : formData.contact_methods.filter(x => x !== opt.id)
                        handleChange('contact_methods', Array.from(new Set(next)))
                      }}
                      className="w-4 h-4 mt-0.5 text-brand border-gray-300 rounded focus:ring-brand shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight">{opt.label}</p>
                      <p className="text-[11px] opacity-80 leading-tight">
                        {blocked
                          ? (opt.needsPhone ? 'Add a phone number first' : 'Add an email first')
                          : opt.helper}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="no_withheld"
              checked={formData.no_withheld_numbers}
              onChange={(e) => handleChange('no_withheld_numbers', e.target.checked)}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <label htmlFor="no_withheld" className="text-sm text-gray-700">
              No withheld numbers (don&apos;t accept hidden/private)
            </label>
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

          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <input
              type="checkbox"
              id="hide_contact"
              checked={formData.hide_contact_info}
              onChange={(e) => handleChange('hide_contact_info', e.target.checked)}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <label htmlFor="hide_contact" className="text-sm text-gray-700">
              Hide all contact information from public (clients contact via internal messaging)
            </label>
          </div>
        </div>

        {/* SECTION 4: Location */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand" />
            <p className="text-sm font-bold text-gray-800">Physical Location</p>
          </div>

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

        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/company')}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>
    </div>
  )
}
