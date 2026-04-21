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
  const [languages, setLanguages] = useState<{ language: string; level: string; stars: number }[]>([])

  const availableLanguages = [
    'English', 'German', 'French', 'Italian', 'Spanish', 'Portuguese',
    'Russian', 'Polish', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
    'Czech', 'Romanian', 'Greek', 'Hungarian', 'Croatian', 'Serbian',
    'Bulgarian', 'Ukrainian', 'Albanian', 'Slovak', 'Slovenian',
    'Hindi', 'Thai', 'Vietnamese', 'Indonesian', 'Malay',
    'Arabic', 'Chinese', 'Japanese', 'Korean', 'Turkish', 'Other'
  ]

  const starToLevel = (stars: number) => {
    if (stars <= 2) return 'basic'
    if (stars === 3) return 'fair'
    if (stars === 4) return 'good'
    return 'excellent_native'
  }

  const levelToDefaultStars = (level: string) => {
    if (level === 'basic') return 2
    if (level === 'fair') return 3
    if (level === 'good') return 4
    return 5
  }

  const starLabel = (stars: number) => {
    if (stars <= 2) return 'Basic'
    if (stars === 3) return 'Fair'
    if (stars === 4) return 'Good'
    return 'Excellent'
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)
        const { data } = await supabase.from('model_languages').select('*').eq('model_id', user.id)
        const mapped = data && data.length > 0
          ? data.map((l: any) => ({ language: l.language, level: l.level, stars: levelToDefaultStars(l.level) }))
          : [{ language: '', level: 'excellent_native', stars: 5 }]
        setLanguages(mapped)
        setLoading(false)
      } catch { setLoading(false) }
    }
    loadData()
  }, [router])

  const addLanguage = () => setLanguages([...languages, { language: '', level: 'excellent_native', stars: 5 }])
  const removeLanguage = (i: number) => setLanguages(languages.filter((_, idx) => idx !== i))
  const updateLanguageField = (i: number, value: string) => {
    const updated = [...languages]
    updated[i].language = value
    setLanguages(updated)
  }
  const updateLanguageStars = (i: number, stars: number) => {
    const updated = [...languages]
    updated[i].stars = stars
    updated[i].level = starToLevel(stars)
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

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
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
                <select value={lang.language} onChange={e => updateLanguageField(i, e.target.value)}
                  className={selectCls + ' flex-1'}>
                  <option value="">Select language...</option>
                  {availableLanguages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateLanguageStars(i, star)}
                      title={starLabel(star)}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-6 h-6 transition-colors ${star <= lang.stars ? 'text-yellow-400' : 'text-gray-200'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  <span className="text-xs text-gray-400 ml-1 w-14">{starLabel(lang.stars)}</span>
                </div>
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
