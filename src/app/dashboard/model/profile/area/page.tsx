'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AreaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [city, setCity] = useState('')
  const [cities, setCities] = useState<any[]>([])
  const [incallOptions, setIncallOptions] = useState<string[]>([])
  const [outcallOptions, setOutcallOptions] = useState<string[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
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
          .select('*')
          .order('name')

        if (citiesData) setCities(citiesData)

        // Load model details
        const { data: modelDetails } = await supabase
          .from('model_details')
          .select('*')
          .eq('model_id', user.id)
          .single()

        if (modelDetails) {
          setCity(modelDetails.city || '')
          setIncallOptions(modelDetails.incall_options || [])
          setOutcallOptions(modelDetails.outcall_options || [])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const toggleIncall = (option: string) => {
    setIncallOptions(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    )
  }

  const toggleOutcall = (option: string) => {
    setOutcallOptions(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    )
  }

  const handleSave = async () => {
    if (!city) {
      alert('Please select a city')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('model_details')
        .upsert({
          model_id: user.id,
          city,
          incall_options: incallOptions.length > 0 ? incallOptions : null,
          outcall_options: outcallOptions.length > 0 ? outcallOptions : null,
        }, { onConflict: 'model_id' })

      if (error) throw error

      alert('Area / Address updated successfully!')
    } catch (error: any) {
      console.error('Error saving:', error)
      alert('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-lg text-sm font-semibold">
                Area / Address
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Select city...</option>
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Incall
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Private apartment', 'Hotel room', 'Club/Studio', 'Other'].map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleIncall(option)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      incallOptions.includes(option)
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Outcall
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Hotel visits only', 'Home visits only', 'Hotel and Home visits', 'Other'].map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOutcall(option)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      outcallOptions.includes(option)
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mt-6">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'SAVE'}
            </button>
          </div>
        </div>
      </div>
  )
}
