'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CompanySidebar from '@/components/layout/CompanySidebar'
import { Building2, Save, AlertCircle } from 'lucide-react'

const ENTRANCE_FEE_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'free', label: 'Free' },
  { value: 'with_cost', label: 'With cost' }
]

const WELLNESS_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
]

const FOOD_DRINKS_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
]

const OUTDOOR_AREA_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
]

interface FormData {
  club_name: string
  display_name: string
  area: string
  about_description: string
  is_club: boolean
  entrance_fee: string
  wellness: string
  food_and_drinks: string
  outdoor_area: string
}

export default function BasicInfoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)
  const [charCount, setCharCount] = useState(0)
  const maxChars = 3000

  const [formData, setFormData] = useState<FormData>({
    club_name: '',
    display_name: '',
    area: '',
    about_description: '',
    is_club: false,
    entrance_fee: 'na',
    wellness: 'na',
    food_and_drinks: 'na',
    outdoor_area: 'na'
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

      // Load existing club details
      const { data: clubData } = await supabase
        .from('club_details')
        .select('*')
        .eq('club_id', user.id)
        .single()

      if (clubData) {
        setFormData({
          club_name: clubData.club_name || '',
          display_name: clubData.display_name || '',
          area: clubData.area || '',
          about_description: clubData.about_description || '',
          is_club: clubData.is_club || false,
          entrance_fee: clubData.entrance_fee || 'na',
          wellness: clubData.wellness || 'na',
          food_and_drinks: clubData.food_and_drinks || 'na',
          outdoor_area: clubData.outdoor_area || 'na'
        })
        setCharCount(clubData.about_description?.length || 0)
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'about_description') {
      setCharCount(value.length)
    }
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

      const { error: updateError } = await supabase
        .from('club_details')
        .update({
          club_name: formData.club_name,
          display_name: formData.display_name,
          area: formData.area,
          about_description: formData.about_description,
          is_club: formData.is_club,
          entrance_fee: formData.entrance_fee,
          wellness: formData.wellness,
          food_and_drinks: formData.food_and_drinks,
          outdoor_area: formData.outdoor_area,
          updated_at: new Date().toISOString()
        })
        .eq('club_id', user.id)

      if (updateError) throw updateError

      setSuccess('Basic info updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <CompanySidebar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <CompanySidebar />
      <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-pink-100 rounded-lg p-2">
                <Building2 className="w-6 h-6 text-pink-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Basic Info</h1>
            </div>
            <p className="text-gray-600">Manage your club's basic information and amenities</p>
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
            {/* Club Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Club Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.club_name}
                onChange={(e) => handleChange('club_name', e.target.value)}
                placeholder="Enter your club's official name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="Public display name (can be different from club name)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">This is how your club will appear to visitors</p>
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Area / Region
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
                placeholder="e.g., Zurich Center, Basel West"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* About Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                About Your Club
              </label>
              <textarea
                value={formData.about_description}
                onChange={(e) => handleChange('about_description', e.target.value)}
                maxLength={maxChars}
                rows={6}
                placeholder="Describe your club, services, atmosphere, and what makes you unique..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
              <div className="mt-1 text-right text-xs text-gray-500">
                {charCount} / {maxChars}
              </div>
            </div>

            {/* Is Club Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={formData.is_club}
                onChange={(e) => handleChange('is_club', e.target.checked)}
                className="mt-1 w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  This is a physical club/venue
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Check this if you operate a physical location (nightclub, gentlemen's club, etc.)
                </p>
              </div>
            </div>

            {/* Amenities Section */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Amenities & Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entrance Fee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Entrance Fee
                  </label>
                  <select
                    value={formData.entrance_fee}
                    onChange={(e) => handleChange('entrance_fee', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {ENTRANCE_FEE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Wellness */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Wellness Facilities
                  </label>
                  <select
                    value={formData.wellness}
                    onChange={(e) => handleChange('wellness', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {WELLNESS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Food & Drinks */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Food & Drinks
                  </label>
                  <select
                    value={formData.food_and_drinks}
                    onChange={(e) => handleChange('food_and_drinks', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {FOOD_DRINKS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Outdoor Area */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Outdoor Area
                  </label>
                  <select
                    value={formData.outdoor_area}
                    onChange={(e) => handleChange('outdoor_area', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {OUTDOOR_AREA_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
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
    </>
  )
}
