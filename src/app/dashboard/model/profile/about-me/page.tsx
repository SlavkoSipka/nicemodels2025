'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Save, CheckCircle, AlertCircle } from 'lucide-react'

export default function AboutMePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [user, setUser] = useState<any>(null)
  const MAX_CHARS = 25000

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)
        const { data: md } = await supabase.from('model_details').select('about_me').eq('model_id', user.id).single()
        if (md?.about_me) setAboutMe(md.about_me)
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
      const { error: e } = await supabase.from('model_details').upsert({ model_id: user.id, about_me: aboutMe }, { onConflict: 'model_id' })
      if (e) throw e
      setSuccess('Saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  const applyFormatting = (tag: string) => {
    const ta = document.getElementById('about-me-textarea') as HTMLTextAreaElement
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = aboutMe.substring(start, end)
    if (selected) {
      setAboutMe(aboutMe.substring(0, start) + `<${tag}>${selected}</${tag}>` + aboutMe.substring(end))
    }
  }

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
              <FileText className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Profile — About Me</h1>
              <p className="text-xs text-gray-500">Describe yourself and your services</p>
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
          <label className="block text-xs font-bold text-gray-800 mb-1">
            Describe yourself <span className="text-red-500">*</span>
          </label>
          <textarea
            id="about-me-textarea"
            value={aboutMe}
            onChange={e => setAboutMe(e.target.value.slice(0, MAX_CHARS))}
            rows={10}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none mb-2"
            placeholder="Write about yourself, your services, what makes you special..."
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {[['b', 'B', 'font-bold'], ['i', 'I', 'italic'], ['u', 'U', 'underline']].map(([tag, label, cls]) => (
                <button key={tag} type="button" onClick={() => applyFormatting(tag)}
                  className={`px-2.5 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50 ${cls}`}>
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400">{aboutMe.length} / {MAX_CHARS}</span>
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
