'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

const MAX_LEN = 10000
const WARN_THRESHOLD = 9000

function plainToSafeHtml(text: string) {
  const esc = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<p>${esc.replace(/\n/g, '<br/>')}</p>`
}

export default function ReplyForm({
  topicId,
  parentId,
  onSuccess,
  placeholder = 'Write a reply...',
}: {
  topicId: string
  parentId: string | null
  onSuccess: () => void
  placeholder?: string
}) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [userId, setUserId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })
  }, [])

  const plainLen = body.replace(/<[^>]*>/g, '').length

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (!userId) {
      setErr('Please sign in to post.')
      return
    }
    if (plainLen < 1) {
      setErr('Message cannot be empty.')
      return
    }
    if (plainLen > MAX_LEN) {
      setErr(`Message too long (max ${MAX_LEN} characters).`)
      return
    }

    setSending(true)
    const supabase = createClient()
    const { error } = await supabase.from('discussion_posts').insert({
      topic_id: topicId,
      parent_id: parentId,
      author_id: userId,
      body: plainToSafeHtml(body.trim()),
    })
    setSending(false)

    if (error) {
      setErr(error.message || 'Could not post')
      return
    }

    setBody('')
    onSuccess()
  }

  if (userId === undefined) {
    return (
      <div className="flex items-center gap-2 py-3">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Checking session...</span>
      </div>
    )
  }

  if (userId === null) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-gray-50 border border-gray-200">
        <p className="text-sm text-gray-600">
          <Link href="/login" className="font-semibold text-pink-600 hover:underline">
            Sign in
          </Link>{' '}
          to join the discussion.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 3 : 4}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none resize-y min-h-[80px] text-gray-900 transition-colors placeholder:text-gray-400"
      />
      <div className="flex flex-wrap items-center gap-2 justify-between">
        {plainLen >= WARN_THRESHOLD ? (
          <span className={`text-[10px] ${plainLen > MAX_LEN ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
            {plainLen} / {MAX_LEN}
          </span>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={sending || plainLen === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-40 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? 'Posting...' : 'Post'}
        </button>
      </div>
      {err && <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-md">{err}</p>}
    </form>
  )
}
