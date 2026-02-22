'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, Save, AlertCircle } from 'lucide-react'

type ScheduleType = 'custom' | 'same_every_day' | '24_7'

interface DayHours {
  from: string
  to: string
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]

export default function WorkingHoursPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)

  const [scheduleType, setScheduleType] = useState<ScheduleType>('24_7')
  const [sameEveryDayHours, setSameEveryDayHours] = useState<DayHours>({ from: '', to: '' })
  const [customHours, setCustomHours] = useState<Record<string, DayHours>>({
    monday: { from: '', to: '' },
    tuesday: { from: '', to: '' },
    wednesday: { from: '', to: '' },
    thursday: { from: '', to: '' },
    friday: { from: '', to: '' },
    saturday: { from: '', to: '' },
    sunday: { from: '', to: '' }
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

      // Load existing working hours from club_working_hours table
      const { data: hoursData } = await supabase
        .from('club_working_hours')
        .select('*')
        .eq('club_id', user.id)

      if (hoursData && hoursData.length > 0) {
        // Check if all days have same hours
        const firstDay = hoursData[0]
        const allSame = hoursData.every(day => 
          day.opens_at === firstDay.opens_at && 
          day.closes_at === firstDay.closes_at &&
          !day.is_closed
        )

        // Check if 24/7
        const is24_7 = hoursData.every(day => 
          day.opens_at === '00:00:00' && 
          day.closes_at === '23:59:59' &&
          !day.is_closed
        )

        if (is24_7) {
          setScheduleType('24_7')
        } else if (allSame && hoursData.length === 7) {
          setScheduleType('same_every_day')
          setSameEveryDayHours({
            from: firstDay.opens_at || '',
            to: firstDay.closes_at || ''
          })
        } else {
          setScheduleType('custom')
          const hoursMap: Record<string, DayHours> = {}
          hoursData.forEach(day => {
            hoursMap[day.day_of_week] = {
              from: day.opens_at || '',
              to: day.closes_at || ''
            }
          })
          setCustomHours(prev => ({ ...prev, ...hoursMap }))
        }
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  const handleCustomHoursChange = (day: string, field: 'from' | 'to', value: string) => {
    setCustomHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')

    // Validation
    if (scheduleType === 'same_every_day') {
      if (!sameEveryDayHours.from || !sameEveryDayHours.to) {
        setError('Please specify opening and closing hours')
        return
      }
    }

    if (scheduleType === 'custom') {
      const hasAnyHours = Object.values(customHours).some(day => day.from || day.to)
      if (!hasAnyHours) {
        setError('Please specify hours for at least one day')
        return
      }
    }

    setSaving(true)

    try {
      const supabase = createClient()

      // Delete existing hours
      await supabase
        .from('club_working_hours')
        .delete()
        .eq('club_id', user.id)

      // Insert new hours based on schedule type
      const hoursToInsert = []

      if (scheduleType === '24_7') {
        // Insert 24/7 hours for all days
        for (const { key } of DAYS) {
          hoursToInsert.push({
            club_id: user.id,
            day_of_week: key,
            opens_at: '00:00:00',
            closes_at: '23:59:59',
            is_closed: false
          })
        }
      } else if (scheduleType === 'same_every_day') {
        // Insert same hours for all days
        for (const { key } of DAYS) {
          hoursToInsert.push({
            club_id: user.id,
            day_of_week: key,
            opens_at: sameEveryDayHours.from,
            closes_at: sameEveryDayHours.to,
            is_closed: false
          })
        }
      } else if (scheduleType === 'custom') {
        // Insert custom hours for each day
        for (const { key } of DAYS) {
          const dayHours = customHours[key]
          if (dayHours.from || dayHours.to) {
            hoursToInsert.push({
              club_id: user.id,
              day_of_week: key,
              opens_at: dayHours.from || null,
              closes_at: dayHours.to || null,
              is_closed: !dayHours.from && !dayHours.to
            })
          } else {
            // Day is closed
            hoursToInsert.push({
              club_id: user.id,
              day_of_week: key,
              opens_at: null,
              closes_at: null,
              is_closed: true
            })
          }
        }
      }

      if (hoursToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('club_working_hours')
          .insert(hoursToInsert)

        if (insertError) throw insertError
      }

      setSuccess('Working hours updated successfully!')
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
              <div className="bg-purple-100 rounded-lg p-2">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Working Hours</h1>
            </div>
            <p className="text-gray-600">Set your club's operating hours for clients</p>
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
            {/* Schedule Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Choose your schedule type:
              </label>
              
              <div className="space-y-3">
                {/* 24/7 */}
                <label 
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    scheduleType === '24_7' 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={scheduleType === '24_7'}
                    onChange={() => setScheduleType('24_7')}
                    className="mt-1 w-5 h-5 text-pink-600 border-gray-300 focus:ring-pink-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Available 24/7</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Your club is open all day, every day
                    </p>
                  </div>
                </label>

                {/* Same Every Day */}
                <label 
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    scheduleType === 'same_every_day' 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={scheduleType === 'same_every_day'}
                    onChange={() => setScheduleType('same_every_day')}
                    className="mt-1 w-5 h-5 text-pink-600 border-gray-300 focus:ring-pink-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Same hours every day</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Open the same hours Monday through Sunday
                    </p>
                  </div>
                </label>

                {/* Custom */}
                <label 
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    scheduleType === 'custom' 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={scheduleType === 'custom'}
                    onChange={() => setScheduleType('custom')}
                    className="mt-1 w-5 h-5 text-pink-600 border-gray-300 focus:ring-pink-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Custom schedule</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Set different hours for each day of the week
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Same Every Day Hours Input */}
            {scheduleType === 'same_every_day' && (
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                <h4 className="font-semibold text-gray-900 mb-3">Daily Hours</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opens at:</label>
                    <input
                      type="time"
                      value={sameEveryDayHours.from}
                      onChange={(e) => setSameEveryDayHours(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closes at:</label>
                    <input
                      type="time"
                      value={sameEveryDayHours.to}
                      onChange={(e) => setSameEveryDayHours(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Hours Input */}
            {scheduleType === 'custom' && (
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                <h4 className="font-semibold text-gray-900 mb-3">Weekly Schedule</h4>
                <div className="space-y-3">
                  {DAYS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="w-28 font-medium text-gray-700">{label}</div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="time"
                            value={customHours[key].from}
                            onChange={(e) => handleCustomHoursChange(key, 'from', e.target.value)}
                            placeholder="Opens"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="time"
                            value={customHours[key].to}
                            onChange={(e) => handleCustomHoursChange(key, 'to', e.target.value)}
                            placeholder="Closes"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  💡 Leave hours empty for days when you're closed
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Tip:</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Your working hours will be displayed on your public profile. Keep them updated to help clients know when to reach you.
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
