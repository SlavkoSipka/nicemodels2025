'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { FileText, Save, CheckCircle, AlertCircle } from 'lucide-react'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { htmlToPlainText } from '@/lib/plainText'

export default function AboutMePage() {
  const router = useRouter()
  const t = useTranslations('dashboard.model.aboutMe')
  const tc = useTranslations('dashboard.model.common')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [user, setUser] = useState<any>(null)
  const MAX_CHARS = 25000
  const MIN_CHARS = 150
  const plainTextLength = htmlToPlainText(aboutMe).trim().length

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
    if (plainTextLength < MIN_CHARS) {
      setError(t('minLengthError', { min: MIN_CHARS }))
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error: e } = await supabase.from('model_details').upsert({ model_id: user.id, about_me: aboutMe }, { onConflict: 'model_id' })
      if (e) throw e
      setSuccess(tc('savedSuccess'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || tc('saveFailed'))
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

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-brand" />
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
          <RichTextEditor
            value={aboutMe}
            onChange={setAboutMe}
            label={t('label')}
            required
            placeholder={t('placeholder')}
            maxLength={MAX_CHARS}
            height={350}
          />
          <p className={`mt-2 text-xs ${plainTextLength < MIN_CHARS ? 'text-amber-600' : 'text-gray-400'}`}>
            {t('minLengthHint', { min: MIN_CHARS, count: plainTextLength })}
          </p>
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
