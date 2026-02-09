'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type DayHours = {
  from: string
  to: string
}

export default function WorkingHoursPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [scheduleType, setScheduleType] = useState<'custom' | 'same_every_day' | '24_7'>('24_7')
  const [sameEveryDayHours, setSameEveryDayHours] = useState<DayHours>({ from: '', to: '' })
  const [customHours, setCustomHours] = useState<Record<string, DayHours>>({
    monday: { from: '', to: '' },
    tuesday: { from: '', to: '' },
    wednesday: { from: '', to: '' },
    thursday: { from: '', to: '' },
    friday: { from: '', to: '' },
    saturday: { from: '', to: '' },
    sunday: { from: '', to: '' },
  })

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

        // Load working hours
        const { data: hoursData } = await supabase
          .from('model_working_hours')
          .select('*')
          .eq('model_id', user.id)

        if (hoursData && hoursData.length > 0) {
          // Check if all days have 00:00 to 23:59 (24/7)
          const is24_7 = hoursData.length === 7 && 
            hoursData.every(h => h.start_time === '00:00:00' && h.end_time === '23:59:00')

          if (is24_7) {
            setScheduleType('24_7')
          } else {
            // Check if all days have same hours
            const firstDay = hoursData[0]
            const allSame = hoursData.every(h => 
              h.start_time === firstDay.start_time && h.end_time === firstDay.end_time
            )

            if (allSame && hoursData.length === 7) {
              setScheduleType('same_every_day')
              setSameEveryDayHours({ 
                from: firstDay.start_time ? firstDay.start_time.slice(0, 5) : '', 
                to: firstDay.end_time ? firstDay.end_time.slice(0, 5) : '' 
              })
            } else {
              setScheduleType('custom')
              const customData: Record<string, DayHours> = {}
              hoursData.forEach(h => {
                customData[h.day_of_week] = { 
                  from: h.start_time ? h.start_time.slice(0, 5) : '', 
                  to: h.end_time ? h.end_time.slice(0, 5) : '' 
                }
              })
              setCustomHours(prev => ({ ...prev, ...customData }))
            }
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const updateCustomHours = (day: string, field: 'from' | 'to', value: string) => {
    setCustomHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const supabase = createClient()

      // Delete existing hours
      await supabase.from('model_working_hours').delete().eq('model_id', user.id)

      const hoursToInsert: any[] = []
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

      if (scheduleType === '24_7') {
        // 24/7 - all days, all hours
        days.forEach(day => {
          hoursToInsert.push({
            model_id: user.id,
            day_of_week: day,
            start_time: '00:00',
            end_time: '23:59',
          })
        })
      } else if (scheduleType === 'same_every_day') {
        if (!sameEveryDayHours.from || !sameEveryDayHours.to) {
          alert('Please set working hours')
          setSaving(false)
          return
        }
        // Same hours every day
        days.forEach(day => {
          hoursToInsert.push({
            model_id: user.id,
            day_of_week: day,
            start_time: sameEveryDayHours.from,
            end_time: sameEveryDayHours.to,
          })
        })
      } else {
        // Custom schedule
        days.forEach(day => {
          if (customHours[day].from && customHours[day].to) {
            hoursToInsert.push({
              model_id: user.id,
              day_of_week: day,
              start_time: customHours[day].from,
              end_time: customHours[day].to,
            })
          }
        })
      }

      if (hoursToInsert.length > 0) {
        const { error } = await supabase
          .from('model_working_hours')
          .insert(hoursToInsert)

        if (error) throw error
      }

      alert('Working hours updated successfully!')
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
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-lg text-sm font-semibold">
                Working Hours
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            {/* Schedule Type Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setScheduleType('24_7')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  scheduleType === '24_7'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                I am available 24/7
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('same_every_day')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  scheduleType === 'same_every_day'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                The same schedule every day
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('custom')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  scheduleType === 'custom'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Schedule
              </button>
            </div>

            {/* Custom Schedule */}
            {scheduleType === 'custom' && (
              <div className="space-y-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div key={day} className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-semibold text-gray-700 capitalize">
                      {day}
                    </label>
                    <input
                      type="time"
                      value={customHours[day].from}
                      onChange={(e) => updateCustomHours(day, 'from', e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <input
                      type="time"
                      value={customHours[day].to}
                      onChange={(e) => updateCustomHours(day, 'to', e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Same Every Day */}
            {scheduleType === 'same_every_day' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    From
                  </label>
                  <input
                    type="time"
                    value={sameEveryDayHours.from}
                    onChange={(e) => setSameEveryDayHours(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    To
                  </label>
                  <input
                    type="time"
                    value={sameEveryDayHours.to}
                    onChange={(e) => setSameEveryDayHours(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* 24/7 */}
            {scheduleType === '24_7' && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">You will be shown as available 24/7</span>
                </p>
              </div>
            )}
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
