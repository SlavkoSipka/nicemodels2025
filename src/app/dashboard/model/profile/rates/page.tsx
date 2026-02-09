'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

type Rate = {
  id?: number
  duration: string
  amount: string
  customTime?: string
  customUnit?: string
}

export default function RatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [incallRates, setIncallRates] = useState<Rate[]>([])
  const [outcallRates, setOutcallRates] = useState<Rate[]>([])
  
  const [newIncallRate, setNewIncallRate] = useState<Rate>({ duration: '30_minutes', amount: '' })
  const [newOutcallRate, setNewOutcallRate] = useState<Rate>({ duration: '1_hour', amount: '' })

  const durationOptions = [
    { value: '30_minutes', label: '30 minutes' },
    { value: '1_hour', label: '1 hour' },
    { value: '2_hours', label: '2 hours' },
    { value: 'specific_time', label: 'For a specific time' },
    { value: 'additional_hour', label: 'Additional hour' },
    { value: 'overnight', label: 'Overnight' },
    { value: 'dinner_date', label: 'Dinner date' },
    { value: 'weekend', label: 'Weekend' },
  ]

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

        // Load rates
        const { data: ratesData } = await supabase
          .from('model_rates')
          .select('*')
          .eq('model_id', user.id)

        if (ratesData) {
          const incall = ratesData
            .filter(r => r.rate_type === 'incall')
            .map(r => ({
              id: r.id,
              duration: r.duration,
              amount: r.amount.toString(),
              customTime: r.custom_time_value?.toString(),
              customUnit: r.custom_time_unit
            }))
          
          const outcall = ratesData
            .filter(r => r.rate_type === 'outcall')
            .map(r => ({
              id: r.id,
              duration: r.duration,
              amount: r.amount.toString(),
              customTime: r.custom_time_value?.toString(),
              customUnit: r.custom_time_unit
            }))

          setIncallRates(incall)
          setOutcallRates(outcall)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const addIncallRate = () => {
    if (!newIncallRate.amount || parseFloat(newIncallRate.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    
    setIncallRates([...incallRates, { ...newIncallRate }])
    setNewIncallRate({ duration: '30_minutes', amount: '' })
  }

  const addOutcallRate = () => {
    if (!newOutcallRate.amount || parseFloat(newOutcallRate.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    
    setOutcallRates([...outcallRates, { ...newOutcallRate }])
    setNewOutcallRate({ duration: '1_hour', amount: '' })
  }

  const removeIncallRate = (index: number) => {
    setIncallRates(incallRates.filter((_, i) => i !== index))
  }

  const removeOutcallRate = (index: number) => {
    setOutcallRates(outcallRates.filter((_, i) => i !== index))
  }

  const getDurationLabel = (value: string) => {
    return durationOptions.find(opt => opt.value === value)?.label || value
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const supabase = createClient()

      // Delete existing rates
      await supabase.from('model_rates').delete().eq('model_id', user.id)

      const ratesToInsert: any[] = []

      // Add incall rates
      incallRates.forEach(rate => {
        const rateData: any = {
          model_id: user.id,
          rate_type: 'incall',
          duration: rate.duration,
          amount: parseFloat(rate.amount),
          currency: 'CHF',
        }
        
        if (rate.duration === 'specific_time' && rate.customTime && rate.customUnit) {
          rateData.custom_time_value = parseInt(rate.customTime)
          rateData.custom_time_unit = rate.customUnit
        }
        
        ratesToInsert.push(rateData)
      })

      // Add outcall rates
      outcallRates.forEach(rate => {
        const rateData: any = {
          model_id: user.id,
          rate_type: 'outcall',
          duration: rate.duration,
          amount: parseFloat(rate.amount),
          currency: 'CHF',
        }
        
        if (rate.duration === 'specific_time' && rate.customTime && rate.customUnit) {
          rateData.custom_time_value = parseInt(rate.customTime)
          rateData.custom_time_unit = rate.customUnit
        }
        
        ratesToInsert.push(rateData)
      })

      if (ratesToInsert.length > 0) {
        const { error } = await supabase.from('model_rates').insert(ratesToInsert)
        if (error) throw error
      }

      alert('Rates updated successfully!')
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-lg text-sm font-semibold">
                Rates
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incall Rates */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Incall Rates</h2>
              
              {/* Add New Rate */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newIncallRate.duration}
                    onChange={(e) => setNewIncallRate({ ...newIncallRate, duration: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {durationOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newIncallRate.amount}
                    onChange={(e) => setNewIncallRate({ ...newIncallRate, amount: e.target.value })}
                    placeholder="0"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <span className="flex items-center px-3 text-sm font-semibold text-gray-600">CHF</span>
                  <button
                    onClick={addIncallRate}
                    className="px-6 py-2.5 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-all"
                  >
                    ADD
                  </button>
                </div>
              </div>

              {/* Rates List */}
              {incallRates.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4">No rates defined</p>
              ) : (
                <div className="space-y-2">
                  {incallRates.map((rate, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <span className="font-semibold text-gray-900">{getDurationLabel(rate.duration)}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="text-pink-600 font-bold">{rate.amount} CHF</span>
                      </div>
                      <button
                        onClick={() => removeIncallRate(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outcall Rates */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Outcall Rates</h2>
              
              {/* Add New Rate */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newOutcallRate.duration}
                    onChange={(e) => setNewOutcallRate({ ...newOutcallRate, duration: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {durationOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newOutcallRate.amount}
                    onChange={(e) => setNewOutcallRate({ ...newOutcallRate, amount: e.target.value })}
                    placeholder="0"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <span className="flex items-center px-3 text-sm font-semibold text-gray-600">CHF</span>
                  <button
                    onClick={addOutcallRate}
                    className="px-6 py-2.5 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-all"
                  >
                    ADD
                  </button>
                </div>
              </div>

              {/* Rates List */}
              {outcallRates.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4">No rates defined</p>
              ) : (
                <div className="space-y-2">
                  {outcallRates.map((rate, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <span className="font-semibold text-gray-900">{getDurationLabel(rate.duration)}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="text-pink-600 font-bold">{rate.amount} CHF</span>
                      </div>
                      <button
                        onClick={() => removeOutcallRate(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
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
