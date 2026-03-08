'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { MessageSquare, Star, Send, Loader2, ChevronRight, Reply } from 'lucide-react'

interface Comment {
  id: string
  user_id: string
  comment_text: string
  rating: number | null
  status: string
  created_at: string
  reply_text: string | null
  replied_at: string | null
  user: { id: string; username: string } | null
}

export default function ModelCommentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadComments()
  }, [])

  async function loadComments() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('model_comments')
        .select('id, user_id, comment_text, rating, status, created_at, reply_text, replied_at, user:profiles!model_comments_user_id_fkey(id, username)')
        .eq('model_id', user.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      const normalized = (data || []).map(c => ({
        ...c,
        user: Array.isArray(c.user) ? (c.user[0] ?? null) : c.user,
      }))
      setComments(normalized)
    } catch {}
    finally { setLoading(false) }
  }

  async function submitReply(commentId: string) {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const supabase = createClient()
      await supabase
        .from('model_comments')
        .update({ reply_text: replyText.trim(), replied_at: new Date().toISOString() })
        .eq('id', commentId)

      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, reply_text: replyText.trim(), replied_at: new Date().toISOString() } : c
      ))
      setReplyingTo(null)
      setReplyText('')
    } catch {}
    finally { setSending(false) }
  }

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <>
        <DashboardSidebar userRole="model" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  const unreplied = comments.filter(c => !c.reply_text)
  const replied = comments.filter(c => !!c.reply_text)

  return (
    <>
      <DashboardSidebar userRole="model" />
      <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
              <p className="text-xs text-gray-500">
                {comments.length} review{comments.length !== 1 ? 's' : ''} · {unreplied.length} awaiting reply
              </p>
            </div>
          </div>

          {comments.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500 mb-1">No reviews yet</p>
              <p className="text-xs text-gray-400">When visitors leave reviews on your profile they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Unreplied first, then replied */}
              {[...unreplied, ...replied].map(comment => {
                const isReplying = replyingTo === comment.id

                return (
                  <div key={comment.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {/* Comment */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(comment.user?.username || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{comment.user?.username || 'Anonymous'}</p>
                            <p className="text-[11px] text-gray-400">{formatTimeAgo(comment.created_at)}</p>
                          </div>
                        </div>
                        {comment.rating && (
                          <div className="flex gap-0.5 shrink-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < comment.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{comment.comment_text}</p>
                    </div>

                    {/* Reply section */}
                    {comment.reply_text ? (
                      <div className="px-5 py-4 bg-brand/5 border-t border-brand/10">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Reply className="w-3.5 h-3.5 text-brand" />
                          <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Your reply</span>
                          <span className="text-[10px] text-gray-400 ml-auto">{comment.replied_at ? formatTimeAgo(comment.replied_at) : ''}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{comment.reply_text}</p>
                      </div>
                    ) : isReplying ? (
                      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex gap-2">
                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Write your reply…"
                            rows={2}
                            maxLength={500}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                            autoFocus
                          />
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              onClick={() => submitReply(comment.id)}
                              disabled={sending || !replyText.trim()}
                              className="px-3 py-2 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                            >
                              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              Send
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText('') }}
                              className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5">{replyText.length}/500</p>
                      </div>
                    ) : (
                      <div className="px-5 py-3 border-t border-gray-100">
                        <button
                          onClick={() => { setReplyingTo(comment.id); setReplyText('') }}
                          className="text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5" /> Reply
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
