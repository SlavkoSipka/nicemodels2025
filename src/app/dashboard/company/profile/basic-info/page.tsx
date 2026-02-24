'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Save, AlertCircle, CheckCircle } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header — compact, dashboard style */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Basic Info</h1>
            <p className="text-xs text-gray-500">Manage your club's basic information and amenities</p>
          </div>
        </div>

        {/* Messages — compact */}
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

        {/* Form — single card, tighter */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          {/* Row 1: Club name + Display name */}
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

          {/* Area — full width, one line */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">Area / Region</label>
            <input
              type="text"
              value={formData.area}
              onChange={(e) => handleChange('area', e.target.value)}
              placeholder="e.g., Zurich Center, Basel West"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          {/* About — smaller textarea */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">About Your Club</label>
            <textarea
              value={formData.about_description}
              onChange={(e) => handleChange('about_description', e.target.value)}
              maxLength={maxChars}
              rows={3}
              placeholder="Describe your club, services, atmosphere..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
            />
            <div className="mt-0.5 text-right text-xs text-gray-400">{charCount} / {maxChars}</div>
          </div>

          {/* Physical club — compact row */}
          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="is_club"
              checked={formData.is_club}
              onChange={(e) => handleChange('is_club', e.target.checked)}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <label htmlFor="is_club" className="text-sm text-gray-700">
              This is a physical club/venue (nightclub, gentlemen's club, etc.)
            </label>
          </div>

          {/* Amenities — one row, 4 selects */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-800 mb-2">Amenities & Features</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Entrance</label>
                <select
                  value={formData.entrance_fee}
                  onChange={(e) => handleChange('entrance_fee', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {ENTRANCE_FEE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Wellness</label>
                <select
                  value={formData.wellness}
                  onChange={(e) => handleChange('wellness', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {WELLNESS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Food & Drinks</label>
                <select
                  value={formData.food_and_drinks}
                  onChange={(e) => handleChange('food_and_drinks', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {FOOD_DRINKS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Outdoor</label>
                <select
                  value={formData.outdoor_area}
                  onChange={(e) => handleChange('outdoor_area', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {OUTDOOR_AREA_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions — same row, minimal */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
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
