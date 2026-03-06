'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, Trash2, Plus, Save, CheckCircle, AlertCircle } from 'lucide-react'

type Rate = { id?: number; duration: string; amount: string; customTime?: string; customUnit?: string }

const DURATION_OPTIONS = [
  { value: '30_minutes', label: '30 min' }, { value: '1_hour', label: '1 hour' },
  { value: '2_hours', label: '2 hours' }, { value: 'specific_time', label: 'Specific time' },
  { value: 'additional_hour', label: 'Additional hour' }, { value: 'overnight', label: 'Overnight' },
  { value: 'dinner_date', label: 'Dinner date' }, { value: 'weekend', label: 'Weekend' },
]

const inputCls = 'px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand'

function RateSection({ title, rates, newRate, setNewRate, onAdd, onRemove }: {
  title: string
  rates: Rate[]
  newRate: Rate
  setNewRate: (r: Rate | ((prev: Rate) => Rate)) => void
  onAdd: () => void
  onRemove: (i: number) => void
}) {
  const getDurationLabel = (v: string) => DURATION_OPTIONS.find(o => o.value === v)?.label || v
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-sm font-bold text-gray-800 mb-3">{title}</p>
      <div className="space-y-2.5 mb-3">
        <select value={newRate.duration} onChange={e => setNewRate(prev => ({ ...prev, duration: e.target.value }))} className={inputCls + ' w-full'}>
          {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            inputMode="decimal"
            value={newRate.amount}
            onChange={e => {
              const v = e.target.value.replace(',', '.')
              if (v === '' || /^\d*\.?\d*$/.test(v)) {
                setNewRate(prev => ({ ...prev, amount: v }))
              }
            }}
            placeholder="0"
            className={inputCls + ' flex-1'}
          />
          <span className="text-xs font-bold text-gray-600">CHF</span>
          <button onClick={onAdd}
            className="flex items-center gap-1 px-3 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover">
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
      {rates.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No rates defined yet</p>
      ) : (
        <div className="space-y-1.5">
          {rates.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-sm text-gray-900">{getDurationLabel(r.duration)}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-brand">{r.amount} CHF</span>
                <button onClick={() => onRemove(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [incallRates, setIncallRates] = useState<Rate[]>([])
  const [outcallRates, setOutcallRates] = useState<Rate[]>([])
  const [newIncall, setNewIncall] = useState<Rate>({ duration: '30_minutes', amount: '' })
  const [newOutcall, setNewOutcall] = useState<Rate>({ duration: '1_hour', amount: '' })

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)
        const { data } = await supabase.from('model_rates').select('*').eq('model_id', user.id)
        if (data) {
          const map = (r: any) => ({ id: r.id, duration: r.duration, amount: r.amount.toString(), customTime: r.custom_time_value?.toString(), customUnit: r.custom_time_unit })
          setIncallRates(data.filter((r: any) => r.rate_type === 'incall').map(map))
          setOutcallRates(data.filter((r: any) => r.rate_type === 'outcall').map(map))
        }
        setLoading(false)
      } catch { setLoading(false) }
    }
    loadData()
  }, [router])

  const addRate = (type: 'incall' | 'outcall') => {
    const rate = type === 'incall' ? newIncall : newOutcall
    if (!rate.amount || parseFloat(rate.amount) <= 0) { setError('Please enter a valid amount'); return }
    setError('')
    if (type === 'incall') { setIncallRates([...incallRates, { ...rate }]); setNewIncall({ duration: '30_minutes', amount: '' }) }
    else { setOutcallRates([...outcallRates, { ...rate }]); setNewOutcall({ duration: '1_hour', amount: '' }) }
  }

  const getDurationLabel = (v: string) => DURATION_OPTIONS.find(o => o.value === v)?.label || v

  const handleSave = async () => {
    setError(''); setSuccess('')
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('model_rates').delete().eq('model_id', user.id)
      const toInsert: any[] = []
      const mapRate = (r: Rate, type: string) => {
        const d: any = { model_id: user.id, rate_type: type, duration: r.duration, amount: parseFloat(r.amount), currency: 'CHF' }
        if (r.duration === 'specific_time' && r.customTime && r.customUnit) {
          d.custom_time_value = parseInt(r.customTime); d.custom_time_unit = r.customUnit
        }
        return d
      }
      incallRates.forEach(r => toInsert.push(mapRate(r, 'incall')))
      outcallRates.forEach(r => toInsert.push(mapRate(r, 'outcall')))
      if (toInsert.length > 0) {
        const { error: e } = await supabase.from('model_rates').insert(toInsert)
        if (e) throw e
      }
      setSuccess('Rates saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || 'Failed to save.')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Profile — Rates</h1>
              <p className="text-xs text-gray-500">Set your incall and outcall pricing in CHF</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RateSection title="Incall Rates" rates={incallRates} newRate={newIncall} setNewRate={setNewIncall}
            onAdd={() => addRate('incall')} onRemove={i => setIncallRates(incallRates.filter((_, x) => x !== i))} />
          <RateSection title="Outcall Rates" rates={outcallRates} newRate={newOutcall} setNewRate={setNewOutcall}
            onAdd={() => addRate('outcall')} onRemove={i => setOutcallRates(outcallRates.filter((_, x) => x !== i))} />
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
