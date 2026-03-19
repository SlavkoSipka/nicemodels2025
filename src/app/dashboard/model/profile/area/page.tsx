'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Save, CheckCircle, AlertCircle, Navigation, Loader2 } from 'lucide-react'
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

  // Live location state
  const [shareLiveLocation, setShareLiveLocation] = useState(false)
  const [liveCity, setLiveCity] = useState<string | null>(null)
  const [livePostalCode, setLivePostalCode] = useState<string | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState('')

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
          setShareLiveLocation(md.share_live_location || false)
          setLiveCity(md.live_location_city || null)
          setLivePostalCode(md.live_location_postal_code || null)
        }
        setLoading(false)
      } catch { setLoading(false) }
    }
    loadData()
  }, [router])

  const handleToggleLiveLocation = useCallback(async (enable: boolean) => {
    setLiveError('')
    if (enable) {
      if (!('geolocation' in navigator)) {
        setLiveError('Geolocation is not supported by your browser')
        return
      }
      setLiveLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch('/api/update-live-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            })
            const data = await res.json()
            if (!res.ok) {
              setLiveError(data.error || 'Failed to update location')
              setLiveLoading(false)
              return
            }
            setShareLiveLocation(true)
            setLiveCity(data.city)
            setLivePostalCode(data.postal_code)
          } catch {
            setLiveError('Failed to send location to server')
          } finally {
            setLiveLoading(false)
          }
        },
        (geoErr) => {
          setLiveLoading(false)
          if (geoErr.code === geoErr.PERMISSION_DENIED) {
            setLiveError('Location permission denied. Please allow location access in your browser settings.')
          } else {
            setLiveError('Could not get your location. Please try again.')
          }
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
      )
    } else {
      setLiveLoading(true)
      try {
        await fetch('/api/update-live-location', { method: 'DELETE' })
        setShareLiveLocation(false)
        setLiveCity(null)
        setLivePostalCode(null)
      } catch {
        setLiveError('Failed to disable live location')
      } finally {
        setLiveLoading(false)
      }
    }
  }, [])

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

  if (loading) return null

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

        {/* Live Location Toggle */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-bold text-gray-800">Share Active Location</p>
          </div>
          <p className="text-xs text-gray-500">
            When enabled, your current location will be shared as a live location on your profile card.
            This does not change your permanent city setting below.
          </p>

          {liveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{liveError}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={liveLoading}
              onClick={() => handleToggleLiveLocation(!shareLiveLocation)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                shareLiveLocation ? 'bg-emerald-500' : 'bg-gray-300'
              } ${liveLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  shareLiveLocation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">
              {liveLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Detecting location...
                </span>
              ) : shareLiveLocation ? 'Active' : 'Disabled'}
            </span>
          </div>

          {shareLiveLocation && liveCity && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-emerald-800">
                Live: {liveCity}{livePostalCode ? ` (${livePostalCode})` : ''}
              </span>
            </div>
          )}
        </div>

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
