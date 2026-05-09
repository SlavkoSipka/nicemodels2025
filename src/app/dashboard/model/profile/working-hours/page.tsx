'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Clock, Save, CheckCircle, AlertCircle } from 'lucide-react'

type DayHours = { from: string; to: string }

export default function WorkingHoursPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.model.workingHours')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [scheduleType, setScheduleType] = useState<'custom' | 'same_every_day' | '24_7'>('24_7')
  const [sameEveryDayHours, setSameEveryDayHours] = useState<DayHours>({ from: '', to: '' })
  const [customHours, setCustomHours] = useState<Record<string, DayHours>>({
    monday: { from: '', to: '' }, tuesday: { from: '', to: '' }, wednesday: { from: '', to: '' },
    thursday: { from: '', to: '' }, friday: { from: '', to: '' }, saturday: { from: '', to: '' }, sunday: { from: '', to: '' },
  })

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayLabels: Record<string, string> = { monday: t('mon'), tuesday: t('tue'), wednesday: t('wed'), thursday: t('thu'), friday: t('fri'), saturday: t('sat'), sunday: t('sun') }

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)
        const { data } = await supabase.from('model_working_hours').select('*').eq('model_id', user.id)
        if (data && data.length > 0) {
          const is24_7 = data.length === 7 && data.every((h: any) => h.start_time === '00:00:00' && h.end_time === '23:59:00')
          if (is24_7) { setScheduleType('24_7') }
          else {
            const first = data[0]
            const allSame = data.every((h: any) => h.start_time === first.start_time && h.end_time === first.end_time)
            if (allSame && data.length === 7) {
              setScheduleType('same_every_day')
              setSameEveryDayHours({ from: first.start_time?.slice(0, 5) || '', to: first.end_time?.slice(0, 5) || '' })
            } else {
              setScheduleType('custom')
              const custom: Record<string, DayHours> = {}
              data.forEach((h: any) => { custom[h.day_of_week] = { from: h.start_time?.slice(0, 5) || '', to: h.end_time?.slice(0, 5) || '' } })
              setCustomHours(prev => ({ ...prev, ...custom }))
            }
          }
        }
        setLoading(false)
      } catch { setLoading(false) }
    }
    loadData()
  }, [router])

  const handleSave = async () => {
    setError(''); setSuccess('')
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('model_working_hours').delete().eq('model_id', user.id)
      const toInsert: any[] = []
      if (scheduleType === '24_7') {
        days.forEach(d => toInsert.push({ model_id: user.id, day_of_week: d, start_time: '00:00', end_time: '23:59' }))
      } else if (scheduleType === 'same_every_day') {
        if (!sameEveryDayHours.from || !sameEveryDayHours.to) { setError(t('setHours')); setSaving(false); return }
        days.forEach(d => toInsert.push({ model_id: user.id, day_of_week: d, start_time: sameEveryDayHours.from, end_time: sameEveryDayHours.to }))
      } else {
        days.forEach(d => { if (customHours[d].from && customHours[d].to) toInsert.push({ model_id: user.id, day_of_week: d, start_time: customHours[d].from, end_time: customHours[d].to }) })
      }
      if (toInsert.length > 0) {
        const { error: e } = await supabase.from('model_working_hours').insert(toInsert)
        if (e) throw e
      }
      setSuccess(t('savedSuccess'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || t('saveFailed'))
    } finally { setSaving(false) }
  }

  const timeCls = 'px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand'
  const tabBtn = (active: boolean) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${active ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-xs text-gray-500">{t('subtitle')}</p>
            </div>
          </div>
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-600 hover:text-gray-900">{t('cancel')}</button>
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

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          {/* Schedule type tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            <button type="button" onClick={() => setScheduleType('24_7')} className={tabBtn(scheduleType === '24_7')}>{t('available247')}</button>
            <button type="button" onClick={() => setScheduleType('same_every_day')} className={tabBtn(scheduleType === 'same_every_day')}>{t('sameEveryDay')}</button>
            <button type="button" onClick={() => setScheduleType('custom')} className={tabBtn(scheduleType === 'custom')}>{t('customSchedule')}</button>
          </div>

          {scheduleType === '24_7' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-emerald-800 font-semibold">{t('appearAs247')}</p>
            </div>
          )}

          {scheduleType === 'same_every_day' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">{t('from')}</label>
                <input type="time" value={sameEveryDayHours.from}
                  onChange={e => setSameEveryDayHours(p => ({ ...p, from: e.target.value }))}
                  className={timeCls + ' w-full'} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">{t('to')}</label>
                <input type="time" value={sameEveryDayHours.to}
                  onChange={e => setSameEveryDayHours(p => ({ ...p, to: e.target.value }))}
                  className={timeCls + ' w-full'} />
              </div>
            </div>
          )}

          {scheduleType === 'custom' && (
            <div className="grid sm:grid-cols-2 gap-2">
              {days.map(day => (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-8 text-xs font-bold text-gray-700 shrink-0">{dayLabels[day]}</span>
                  <input type="time" value={customHours[day].from}
                    onChange={e => setCustomHours(p => ({ ...p, [day]: { ...p[day], from: e.target.value } }))}
                    className={timeCls + ' flex-1'} />
                  <span className="text-xs text-gray-400">–</span>
                  <input type="time" value={customHours[day].to}
                    onChange={e => setCustomHours(p => ({ ...p, [day]: { ...p[day], to: e.target.value } }))}
                    className={timeCls + ' flex-1'} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pb-2">
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-600 hover:text-gray-900">{t('cancel')}</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="w-4 h-4" />
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
