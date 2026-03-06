'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Save, CheckCircle, AlertCircle } from 'lucide-react'
import CitySearch, { type CityResult } from '@/components/ui/CitySearch'

export default function AreaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [city, setCity] = useState('')
  const [incallOptions, setIncallOptions] = useState<string[]>([])
  const [outcallOptions, setOutcallOptions] = useState<string[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)
        const { data: md } = await supabase
          .from('model_details')
          .select('*')
          .eq('model_id', user.id)
          .single()
        if (md) {
          setCity(md.city || '')
          setIncallOptions(md.incall_options || [])
          setOutcallOptions(md.outcall_options || [])
        }
        setLoading(false)
      } catch { setLoading(false) }
    }
    loadData()
  }, [router])

  const toggle = (arr: string[], setArr: (v: string[]) => void, opt: string) =>
    setArr(arr.includes(opt) ? arr.filter(o => o !== opt) : [...arr, opt])

  const handleSave = async () => {
    setError(''); setSuccess('')
    if (!city) { setError('Please select a city'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error: e } = await supabase.from('model_details').upsert({
        model_id: user.id,
        city,
        incall_options: incallOptions.length > 0 ? incallOptions : null,
        outcall_options: outcallOptions.length > 0 ? outcallOptions : null,
      }, { onConflict: 'model_id' })
      if (e) throw e
      setSuccess('Area saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  const toggleBtn = (active: boolean) =>
    `px-3 py-2 text-sm rounded-lg border transition-colors font-medium ${
      active ? 'border-brand bg-brand/10 text-brand' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
    }`

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Profile — Area / Address</h1>
              <p className="text-xs text-gray-500">Set your city and availability options</p>
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
            <p className="text-sm text-emerald-800">{success}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
          {/* City */}
          <div>
            <CitySearch
              value={city}
              onChange={(c) => setCity(c?.name || '')}
              label="City"
              required
              placeholder="Search city or PLZ..."
            />
          </div>

          {/* Incall */}
          <div>
            <p className="text-xs font-bold text-gray-800 mb-2">Incall</p>
            <div className="grid grid-cols-2 gap-2">
              {['Private apartment', 'Hotel room', 'Club/Studio', 'Other'].map(opt => (
                <button key={opt} type="button" onClick={() => toggle(incallOptions, setIncallOptions, opt)}
                  className={toggleBtn(incallOptions.includes(opt))}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Outcall */}
          <div>
            <p className="text-xs font-bold text-gray-800 mb-2">Outcall</p>
            <div className="grid grid-cols-2 gap-2">
              {['Hotel visits only', 'Home visits only', 'Hotel and Home visits', 'Other'].map(opt => (
                <button key={opt} type="button" onClick={() => toggle(outcallOptions, setOutcallOptions, opt)}
                  className={toggleBtn(outcallOptions.includes(opt))}>
                  {opt}
                </button>
              ))}
            </div>
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
