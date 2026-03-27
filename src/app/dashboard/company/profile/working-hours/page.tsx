'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, Save, AlertCircle, CheckCircle } from 'lucide-react'

type ScheduleType = 'custom' | 'same_every_day' | '24_7'

interface DayHours {
  from: string
  to: string
}

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' }
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

      const { data: hoursData } = await supabase
        .from('club_working_hours')
        .select('*')
        .eq('club_id', user.id)

      if (hoursData && hoursData.length > 0) {
        const firstDay = hoursData[0]
        const allSame = hoursData.every(day =>
          day.opens_at === firstDay.opens_at &&
          day.closes_at === firstDay.closes_at &&
          !day.is_closed
        )
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
            from: firstDay.opens_at?.slice(0, 5) || '',
            to: firstDay.closes_at?.slice(0, 5) || ''
          })
        } else {
          setScheduleType('custom')
          const hoursMap: Record<string, DayHours> = {}
          hoursData.forEach(day => {
            hoursMap[day.day_of_week] = {
              from: day.opens_at?.slice(0, 5) || '',
              to: day.closes_at?.slice(0, 5) || ''
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

      await supabase
        .from('club_working_hours')
        .delete()
        .eq('club_id', user.id)

      const toTime = (v: string) => (v ? (v.length === 5 ? `${v}:00` : v) : null)
      const hoursToInsert: any[] = []

      if (scheduleType === '24_7') {
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
        const from = toTime(sameEveryDayHours.from)
        const to = toTime(sameEveryDayHours.to)
        for (const { key } of DAYS) {
          hoursToInsert.push({
            club_id: user.id,
            day_of_week: key,
            opens_at: from,
            closes_at: to,
            is_closed: false
          })
        }
      } else {
        for (const { key } of DAYS) {
          const dayHours = customHours[key]
          if (dayHours.from || dayHours.to) {
            hoursToInsert.push({
              club_id: user.id,
              day_of_week: key,
              opens_at: toTime(dayHours.from),
              closes_at: toTime(dayHours.to),
              is_closed: false
            })
          } else {
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

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header — dashboard style */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Working Hours</h1>
            <p className="text-xs text-gray-500">Set your club's operating hours for clients</p>
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

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <p className="text-sm font-bold text-gray-800">Schedule type</p>
          <div className="space-y-2">
            <label
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                scheduleType === '24_7'
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="scheduleType"
                checked={scheduleType === '24_7'}
                onChange={() => setScheduleType('24_7')}
                className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Available 24/7</span>
                <span className="text-xs text-gray-500 ml-1">— open all day, every day</span>
              </div>
            </label>
            <label
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                scheduleType === 'same_every_day'
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="scheduleType"
                checked={scheduleType === 'same_every_day'}
                onChange={() => setScheduleType('same_every_day')}
                className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Same hours every day</span>
                <span className="text-xs text-gray-500 ml-1">— Mon–Sun same times</span>
              </div>
            </label>
            <label
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                scheduleType === 'custom'
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="scheduleType"
                checked={scheduleType === 'custom'}
                onChange={() => setScheduleType('custom')}
                className="w-4 h-4 text-brand border-gray-300 focus:ring-brand"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Custom schedule</span>
                <span className="text-xs text-gray-500 ml-1">— different hours per day</span>
              </div>
            </label>
          </div>

          {scheduleType === 'same_every_day' && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-bold text-gray-800 mb-2">Daily hours</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Opens at</label>
                  <input
                    type="time"
                    value={sameEveryDayHours.from}
                    onChange={(e) => setSameEveryDayHours(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Closes at</label>
                  <input
                    type="time"
                    value={sameEveryDayHours.to}
                    onChange={(e) => setSameEveryDayHours(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {scheduleType === 'custom' && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-bold text-gray-800 mb-2">Weekly schedule</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {DAYS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-10 text-sm font-medium text-gray-700">{label}</div>
                    <input
                      type="time"
                      value={customHours[key].from}
                      onChange={(e) => handleCustomHoursChange(key, 'from', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <span className="text-gray-400 text-xs">–</span>
                    <input
                      type="time"
                      value={customHours[key].to}
                      onChange={(e) => handleCustomHoursChange(key, 'to', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Leave empty for closed days.</p>
            </div>
          )}

          <div className="bg-blue-50/80 border border-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Tip:</span> Working hours are shown on your public profile. Keep them updated so clients know when you're available.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
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
