'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Languages, Trash2, Plus, Save, CheckCircle, AlertCircle } from 'lucide-react'

export default function LanguagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [languages, setLanguages] = useState<{ language: string; level: string }[]>([])

  const availableLanguages = [
    'English', 'German', 'French', 'Italian', 'Spanish', 'Portuguese',
    'Russian', 'Polish', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
    'Czech', 'Romanian', 'Greek', 'Hungarian', 'Croatian', 'Serbian',
    'Bulgarian', 'Ukrainian', 'Albanian', 'Slovak', 'Slovenian',
    'Hindi', 'Thai', 'Vietnamese', 'Indonesian', 'Malay',
    'Arabic', 'Chinese', 'Japanese', 'Korean', 'Turkish', 'Other'
  ]

  const levels = [
    { value: 'basic', label: 'Basic' },
    { value: 'fair', label: 'Fair' },
    { value: 'good', label: 'Good' },
    { value: 'excellent_native', label: 'Excellent / Native' }
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)
        const { data } = await supabase.from('model_languages').select('*').eq('model_id', user.id)
        setLanguages(data && data.length > 0 ? data : [{ language: '', level: 'good' }])
        setLoading(false)
      } catch { setLoading(false) }
    }
    loadData()
  }, [router])

  const addLanguage = () => setLanguages([...languages, { language: '', level: 'good' }])
  const removeLanguage = (i: number) => setLanguages(languages.filter((_, idx) => idx !== i))
  const updateLanguage = (i: number, field: 'language' | 'level', value: string) => {
    const updated = [...languages]
    updated[i][field] = value
    setLanguages(updated)
  }

  const handleSave = async () => {
    setError(''); setSuccess('')
    const valid = languages.filter(l => l.language)
    if (valid.length === 0) { setError('Please add at least one language'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('model_languages').delete().eq('model_id', user.id)
      const { error: e } = await supabase.from('model_languages').insert(
        valid.map(l => ({ model_id: user.id, language: l.language, level: l.level }))
      )
      if (e) throw e
      setSuccess('Languages saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  const selectCls = 'px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent'

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
              <Languages className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Profile — Languages</h1>
              <p className="text-xs text-gray-500">Add languages you speak and your proficiency level</p>
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

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="space-y-2.5 mb-4">
            {languages.map((lang, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select value={lang.language} onChange={e => updateLanguage(i, 'language', e.target.value)}
                  className={selectCls + ' flex-1'}>
                  <option value="">Select language...</option>
                  {availableLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={lang.level} onChange={e => updateLanguage(i, 'level', e.target.value)}
                  className={selectCls + ' w-40'}>
                  {levels.map(lv => <option key={lv.value} value={lv.value}>{lv.label}</option>)}
                </select>
                {languages.length > 1 && (
                  <button onClick={() => removeLanguage(i)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addLanguage}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover">
            <Plus className="w-4 h-4" />
            Add Another Language
          </button>
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
