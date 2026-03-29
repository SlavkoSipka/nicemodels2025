'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, MessageSquarePlus, Pin, Trash2, ExternalLink } from 'lucide-react'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { isDiscussionSchemaMissing } from '@/lib/discussion/supabaseErrors'

interface TopicRow {
  id: string
  slug: string
  title: string
  body: string
  status: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export default function AdminDiscussionsPage() {
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft')
  const [isPinned, setIsPinned] = useState(false)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [schemaMissing, setSchemaMissing] = useState(false)

  const load = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error: qErr } = await supabase
      .from('discussion_topics')
      .select('id, slug, title, body, status, is_pinned, created_at, updated_at')
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (qErr) {
      const missing = isDiscussionSchemaMissing(qErr)
      setSchemaMissing(missing)
      setError(
        missing
          ? 'Database tables for discussions are not installed yet. Run the SQL in supabase-docs/CREATE-discussion-topics.sql in the Supabase SQL Editor, then reload this page.'
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

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    const res = await fetch('/api/admin/discussion-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        status,
        is_pinned: isPinned,
        ...(slug.trim() ? { slug: slug.trim() } : {}),
      }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) {
      setError(data.error || 'Failed to create')
      return
    }
    setTitle('')
    setSlug('')
    setBody('')
    setStatus('draft')
    setIsPinned(false)
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
      setError(data.error || 'Update failed')
      return
    }
    await load()
  }

  const removeTopic = async (id: string) => {
    if (!confirm('Delete this topic and all posts? This cannot be undone.')) return
    setSavingId(id)
    const res = await fetch(`/api/admin/discussion-topics?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const data = await res.json()
    setSavingId(null)
    if (!res.ok) {
      setError(data.error || 'Delete failed')
      return
    }
    await load()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" /> Admin
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquarePlus className="w-7 h-7 text-pink-600" />
              Discussion topics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create a topic, set it to Active for it to appear on the public blog. Participants reply in a thread.
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

          <form onSubmit={submitCreate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">New topic</h2>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Topic title"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Slug (optional)</label>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                placeholder="auto from title if empty"
              />
            </div>
            <RichTextEditor label="Opening post / description" value={body} onChange={setBody} height={220} />
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as typeof status)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active (visible on site)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <label className="flex items-center gap-2 mt-6 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={e => setIsPinned(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Pin (sorts to top)
              </label>
              <button
                type="submit"
                disabled={creating}
                className="mt-6 ml-auto px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create topic'}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">All topics</h2>
            {topics.length === 0 ? (
              <p className="text-sm text-gray-500">No topics yet.</p>
            ) : (
              <ul className="space-y-2">
                {topics.map(t => (
                  <li
                    key={t.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {t.is_pinned && (
                          <Pin className="w-4 h-4 text-amber-500 shrink-0" aria-label="Pinned" />
                        )}
                        <span className="font-semibold text-gray-900 truncate">{t.title}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            t.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'draft'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-1">/blog/{t.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {t.status !== 'active' && (
                        <button
                          type="button"
                          disabled={savingId === t.id}
                          onClick={() => patchTopic(t.id, { status: 'active' })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Set active
                        </button>
                      )}
                      {t.status === 'active' && (
                        <button
                          type="button"
                          disabled={savingId === t.id}
                          onClick={() => patchTopic(t.id, { status: 'archived' })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={savingId === t.id}
                        onClick={() => patchTopic(t.id, { is_pinned: !t.is_pinned })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {t.is_pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <Link
                        href={`/blog/${t.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-pink-200 text-pink-700 hover:bg-pink-50"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button
                        type="button"
                        disabled={savingId === t.id}
                        onClick={() => removeTopic(t.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
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
