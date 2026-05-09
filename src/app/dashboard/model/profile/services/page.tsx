'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, ChevronDown, ChevronUp, Save, CheckCircle, AlertCircle } from 'lucide-react'

export default function ServicesPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.model.services')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [sexualOrientation, setSexualOrientation] = useState('')
  const [servicesFor, setServicesFor] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [allServices, setAllServices] = useState<any[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [otherServices, setOtherServices] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)
        const [{ data: servicesData }, { data: md }, { data: modelServicesData }] = await Promise.all([
          supabase.from('services').select('*').order('category').order('name'),
          supabase.from('model_details').select('*').eq('model_id', user.id).single(),
          supabase.from('model_services').select('service_id').eq('model_id', user.id)
        ])
        if (servicesData) setAllServices(servicesData)
        if (md) {
          setSexualOrientation(md.sexual_orientation || '')
          setServicesFor(md.services_for || [])
          setOtherServices(md.other_services || '')
        }
        if (modelServicesData) setSelectedServices(modelServicesData.map((s: any) => s.service_id))
        setLoading(false)
      } catch { setLoading(false) }
    }
    loadData()
  }, [router])

  const toggleFor = (opt: string) =>
    setServicesFor(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  const toggleService = (id: number) =>
    setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleCategory = (cat: string) =>
    setExpandedCategory(prev => prev === cat ? null : cat)
  const getServicesByCategory = (cat: string) => allServices.filter(s => s.category === cat)
  const getSelectedCount = (cat: string) => getServicesByCategory(cat).filter(s => selectedServices.includes(s.id)).length
  const getCategoryLabel = (cat: string) => ({
    main: t('mainServices'), extra: t('extraServices'),
    fetish_bizarre: t('fetishBizarre'), virtual: t('virtualServices'),
    massage: t('massage')
  }[cat] || cat)

  const handleSave = async () => {
    setError(''); setSuccess('')
    setSaving(true)
    try {
      const supabase = createClient()
      const trimmedOther = otherServices.trim()
      const { error: e1 } = await supabase.from('model_details').upsert({
        model_id: user.id,
        sexual_orientation: sexualOrientation || null,
        services_for: servicesFor.length > 0 ? servicesFor : null,
        other_services: trimmedOther.length > 0 ? trimmedOther.slice(0, 2000) : null,
      }, { onConflict: 'model_id' })
      if (e1) throw e1
      await supabase.from('model_services').delete().eq('model_id', user.id)
      if (selectedServices.length > 0) {
        const { error: e2 } = await supabase.from('model_services').insert(
          selectedServices.map(id => ({ model_id: user.id, service_id: id }))
        )
        if (e2) throw e2
      }
      setSuccess(t('savedSuccess'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || t('saveFailed'))
    } finally { setSaving(false) }
  }

  const selectCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand'
  const toggleBtn = (active: boolean) =>
    `px-3 py-2 text-sm rounded-lg border transition-colors font-medium ${
      active ? 'border-brand bg-brand/10 text-brand' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
    }`

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand" />
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

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
          {/* Sexual Orientation */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">{t('sexualOrientation')}</label>
            <select value={sexualOrientation} onChange={e => setSexualOrientation(e.target.value)} className={selectCls}>
              <option value="">{t('select')}</option>
              <option value="heterosexual">{t('heterosexual')}</option>
              <option value="bisexual">{t('bisexual')}</option>
              <option value="homosexual">{t('homosexual')}</option>
            </select>
          </div>

          {/* Services For */}
          <div>
            <p className="text-xs font-bold text-gray-800 mb-2">{t('servicesFor')}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'men', label: t('men') }, { value: 'women', label: t('women') },
                { value: 'couples', label: t('couples') }, { value: 'trans', label: t('trans') },
                { value: 'gays', label: t('gays') }
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => toggleFor(opt.value)}
                  className={toggleBtn(servicesFor.includes(opt.value))}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs font-bold text-gray-800 mb-2">{t('services')}</p>
            <div className="space-y-2">
              {['main', 'extra', 'fetish_bizarre', 'virtual', 'massage'].map(cat => {
                const catServices = getServicesByCategory(cat)
                const isExpanded = expandedCategory === cat
                return (
                  <div key={cat} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button type="button" onClick={() => toggleCategory(cat)}
                      className="w-full px-4 py-2.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-brand">{getCategoryLabel(cat)}</span>
                        <span className="text-xs text-gray-500">{getSelectedCount(cat)}/{catServices.length}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>
                    {isExpanded && (
                      <div className="p-3 bg-white grid grid-cols-2 gap-2">
                        {catServices.map(svc => (
                          <label key={svc.id} className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-brand/5 transition-colors text-sm">
                            <input type="checkbox" checked={selectedServices.includes(svc.id)}
                              onChange={() => toggleService(svc.id)}
                              className="w-3.5 h-3.5 text-brand rounded focus:ring-brand" />
                            <span>{svc.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label htmlFor="otherServices" className="block text-xs font-bold text-gray-800 mb-1">
                {t('otherServices')}
              </label>
              <p className="text-[11px] text-gray-500 mb-2">
                {t('otherServicesHint')}
              </p>
              <textarea
                id="otherServices"
                value={otherServices}
                onChange={e => setOtherServices(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder={t('otherServicesPlaceholder')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-y min-h-[96px]"
              />
              <p className="text-[11px] text-gray-400 mt-1 text-right">{otherServices.length}/2000</p>
            </div>
          </div>
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
