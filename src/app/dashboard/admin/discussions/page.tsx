'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MessageSquarePlus, Pin, Trash2, ExternalLink, ImagePlus, X } from 'lucide-react'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { isDiscussionSchemaMissing } from '@/lib/discussion/supabaseErrors'

interface TopicRow {
  id: string
  slug: string
  title: string
  body: string
  status: string
  is_pinned: boolean
  cover_image: string | null
  created_at: string
  updated_at: string
}

export default function AdminDiscussionsPage() {
  const t = useTranslations('admin.discussions')
  const tc = useTranslations('admin.common')
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft')
  const [isPinned, setIsPinned] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [schemaMissing, setSchemaMissing] = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  const coverUrl = (path: string | null) =>
    path ? `${supabaseUrl}/storage/v1/object/public/discussion-images/${path}` : null

  const load = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error: qErr } = await supabase
      .from('discussion_topics')
      .select('id, slug, title, body, status, is_pinned, cover_image, created_at, updated_at')
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (qErr) {
      const missing = isDiscussionSchemaMissing(qErr)
      setSchemaMissing(missing)
      setError(
        missing
          ? t('schemaMissing')
          : qErr.message,
      )
      setTopics([])
    } else {
      setSchemaMissing(false)
      setTopics((data || []) as TopicRow[])
      setError('')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const uploadCover = async (file: File): Promise<string | null> => {
    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error: upErr } = await supabase.storage.from('discussion-images').upload(path, file, { upsert: true })
    if (upErr) { setError(t('imageUploadFailed', { message: upErr.message })); return null }
    return path
  }

  const handleCoverFile = (file: File | null) => {
    setCoverFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setCoverPreview(url)
    } else {
      setCoverPreview(null)
    }
  }

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    let cover_image: string | null = null
    if (coverFile) {
      cover_image = await uploadCover(coverFile)
      if (!cover_image) { setCreating(false); return }
    }

    const res = await fetch('/api/admin/discussion-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        status,
        is_pinned: isPinned,
        cover_image,
        ...(slug.trim() ? { slug: slug.trim() } : {}),
      }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) {
      setError(data.error || t('createFailed'))
      return
    }
    setTitle('')
    setSlug('')
    setBody('')
    setStatus('draft')
    setIsPinned(false)
    setCoverFile(null)
    setCoverPreview(null)
    await load()
  }

  const patchTopic = async (id: string, patch: Record<string, unknown>) => {
    setSavingId(id)
    setError('')
    const res = await fetch('/api/admin/discussion-topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
    const data = await res.json()
    setSavingId(null)
    if (!res.ok) {
      setError(data.error || t('updateFailed'))
      return
    }
    await load()
  }

  const removeTopic = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return
    setSavingId(id)
    const res = await fetch(`/api/admin/discussion-topics?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const data = await res.json()
    setSavingId(null)
    if (!res.ok) {
      setError(data.error || t('deleteFailed'))
      return
    }
    await load()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        {tc('loading')}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" /> {t('back')}
            </Link>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquarePlus className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600 shrink-0" />
              <span className="truncate">{t('title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {t('subtitle')}
            </p>
          </div>

          {error && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                schemaMissing
                  ? 'border-amber-300 bg-amber-50 text-amber-950'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {error}
            </div>
          )}

          <form onSubmit={submitCreate} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t('newTopic')}</h2>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('fieldTitle')}</label>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder={t('titlePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('fieldSlug')}</label>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                placeholder={t('slugPlaceholder')}
              />
            </div>
            <RichTextEditor label={t('openingPost')} value={body} onChange={setBody} height={220} />

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('coverImage')}</label>
              {coverPreview ? (
                <div className="relative inline-block">
                  <Image src={coverPreview} alt={t('coverPreview')} width={320} height={180} className="rounded-lg object-cover border border-gray-200" style={{ maxHeight: 180 }} />
                  <button type="button" onClick={() => handleCoverFile(null)} className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 shadow hover:bg-red-50">
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  {t('chooseImage')}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverFile(f) }} />
                </label>
              )}
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('fieldStatus')}</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as typeof status)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="draft">{t('statusDraft')}</option>
                  <option value="active">{t('statusActive')}</option>
                  <option value="archived">{t('statusArchived')}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={e => setIsPinned(e.target.checked)}
                  className="rounded border-gray-300"
                />
                {t('pin')}
              </label>
              <button
                type="submit"
                disabled={creating}
                className="ml-auto px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {creating ? t('creating') : t('createTopic')}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">{t('allTopics')}</h2>
            {topics.length === 0 ? (
              <p className="text-sm text-gray-500">{t('noTopics')}</p>
            ) : (
              <ul className="space-y-2">
                {topics.map(topic => (
                  <li
                    key={topic.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-start gap-3"
                  >
                    {coverUrl(topic.cover_image) && (
                      <Image src={coverUrl(topic.cover_image)!} alt="" width={96} height={64} className="rounded-md object-cover shrink-0 border border-gray-100" style={{ width: 96, height: 64 }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {topic.is_pinned && (
                          <Pin className="w-4 h-4 text-amber-500 shrink-0" aria-label={t('pinned')} />
                        )}
                        <span className="font-semibold text-gray-900 truncate">{topic.title}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            topic.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : topic.status === 'draft'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {topic.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-1">/blog/{topic.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {topic.status !== 'active' && (
                        <button
                          type="button"
                          disabled={savingId === topic.id}
                          onClick={() => patchTopic(topic.id, { status: 'active' })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {t('setActive')}
                        </button>
                      )}
                      {topic.status === 'active' && (
                        <button
                          type="button"
                          disabled={savingId === topic.id}
                          onClick={() => patchTopic(topic.id, { status: 'archived' })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                        >
                          {t('archive')}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={savingId === topic.id}
                        onClick={() => patchTopic(topic.id, { is_pinned: !topic.is_pinned })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {topic.is_pinned ? t('unpin') : 'Pin'}
                      </button>
                      <label className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer disabled:opacity-50">
                        <ImagePlus className="w-3 h-3" />
                        {topic.cover_image ? t('changeCover') : t('addCover')}
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          const path = await uploadCover(f)
                          if (path) await patchTopic(topic.id, { cover_image: path })
                        }} />
                      </label>
                      {topic.cover_image && (
                        <button
                          type="button"
                          disabled={savingId === topic.id}
                          onClick={() => patchTopic(topic.id, { cover_image: null })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600"
                        >
                          {t('removeCover')}
                        </button>
                      )}
                      <Link
                        href={`/blog/${topic.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-pink-200 text-pink-700 hover:bg-pink-50"
                      >
                        {t('view')} <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button
                        type="button"
                        disabled={savingId === topic.id}
                        onClick={() => removeTopic(topic.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> {t('delete')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
