'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  MessageSquare, CheckCircle, XCircle, User, Phone, Mail,
  MapPin, Calendar, Loader2, MessageCircle, ArrowLeft, Clock, Reply
} from 'lucide-react'

interface Comment {
  id: string
  comment_text: string
  rating: number | null
  status: string
  created_at: string
  reply_text: string | null
  replied_at: string | null
  user: {
    id: string; username: string; email: string
    phone: string | null; city: string | null; description: string | null
    avatar_url?: string | null
  }
  model: {
    id: string; username: string; email: string; public_id?: number | null
    model_details: Array<{ showname: string; city: string }>
    model_contact_details: Array<{
      phone_number: string; country_code: string
      has_whatsapp: boolean; has_viber: boolean; has_telegram: boolean
    }>
  }
}

export default function CommentsReviewClient({ comments: initialComments }: { comments: Comment[] }) {
  const [comments, setComments] = useState(initialComments)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const handleApprove = async (commentId: string) => {
    setProcessing(commentId)
    const supabase = createClient()
    const { error } = await supabase.from('model_comments').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', commentId)
    if (!error) setComments(comments.map(c => c.id === commentId ? { ...c, status: 'approved' } : c))
    setProcessing(null)
  }

  const handleReject = async (commentId: string) => {
    setProcessing(commentId)
    const supabase = createClient()
    const { error } = await supabase.from('model_comments').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', commentId)
    if (!error) setComments(comments.map(c => c.id === commentId ? { ...c, status: 'rejected' } : c))
    setProcessing(null)
  }

  const filtered = filter === 'all' ? comments : comments.filter(c => c.status === filter)
  const approved = comments.filter(c => c.status === 'approved').length
  const rejected = comments.filter(c => c.status === 'rejected').length

  const tabCls = (active: boolean, color?: string) =>
    `px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
      active
        ? color === 'amber' ? 'bg-amber-100 text-amber-700'
          : color === 'emerald' ? 'bg-emerald-100 text-emerald-700'
          : color === 'red' ? 'bg-red-100 text-red-700'
          : 'bg-brand/10 text-brand'
        : 'text-gray-500 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Comments Review</h1>
                  <p className="text-xs text-gray-500">Manage published comments and reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-end">
            <div className="flex gap-1">
              <button onClick={() => setFilter('all')} className={tabCls(filter === 'all')}>All ({comments.length})</button>
              <button onClick={() => setFilter('approved')} className={tabCls(filter === 'approved', 'emerald')}>Approved ({approved})</button>
              <button onClick={() => setFilter('rejected')} className={tabCls(filter === 'rejected', 'red')}>Rejected ({rejected})</button>
            </div>
          </div>

          {/* Comments list */}
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg py-12 text-center">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {filter === 'approved' ? 'No approved comments' : filter === 'rejected' ? 'No rejected comments' : 'No comments yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(comment => {
                const modelName = comment.model.model_details[0]?.showname || comment.model.username
                const contact = comment.model.model_contact_details[0]

                return (
                  <div key={comment.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4">
                      {/* Top row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/models/${comment.model.id}`} className="text-sm font-bold text-gray-900 hover:text-brand transition-colors">
                            {modelName}
                            {comment.model.public_id && <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{comment.model.public_id}</span>}
                          </Link>
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            comment.status === 'pending' ? 'bg-amber-50 text-amber-700' : comment.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {comment.status === 'pending' ? <Clock className="w-3 h-3" /> : comment.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {comment.status.toUpperCase()}
                          </span>
                          {comment.rating && (
                            <span className="text-xs text-amber-500 font-bold">
                              {'★'.repeat(comment.rating)}{'☆'.repeat(5 - comment.rating)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Comment text */}
                      <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-2 text-sm text-gray-800 leading-relaxed">
                        {comment.comment_text}
                      </div>

                      {/* Model reply */}
                      {comment.reply_text && (
                        <div className="flex items-start gap-2 mb-3 pl-3 border-l-2 border-brand/30">
                          <Reply className="w-3.5 h-3.5 text-brand mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-brand mb-0.5">
                              {comment.model.model_details[0]?.showname || comment.model.username} replied
                              {comment.replied_at && (
                                <span className="font-normal text-gray-400 ml-1.5">
                                  · {new Date(comment.replied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">{comment.reply_text}</p>
                          </div>
                        </div>
                      )}

                      {/* Info columns */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {/* User info */}
                        <div className="border border-blue-100 rounded-lg p-3 bg-blue-50/50">
                          <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-600" /> Commenter
                          </p>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center gap-2 mb-1">
                              {comment.user.avatar_url ? (
                                <img src={comment.user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                              ) : null}
                              <p className="font-semibold text-gray-800">{comment.user.username || '—'}</p>
                            </div>
                            <a href={`mailto:${comment.user.email}`} className="flex items-center gap-1 hover:text-brand hover:underline"><Mail className="w-3 h-3 text-gray-400" />{comment.user.email}</a>
                            {comment.user.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" />{comment.user.phone}</p>}
                            {comment.user.city && <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{comment.user.city}</p>}
                          </div>
                        </div>

                        {/* Model info */}
                        <div className="border border-brand/20 rounded-lg p-3 bg-brand/5">
                          <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <User className="w-3 h-3 text-brand" /> Model Contact
                          </p>
                          <div className="space-y-1 text-xs text-gray-600">
                            <p className="font-semibold text-gray-800">{modelName}</p>
                            <a href={`mailto:${comment.model.email}`} className="flex items-center gap-1 hover:text-brand hover:underline"><Mail className="w-3 h-3 text-gray-400" />{comment.model.email}</a>
                            {contact?.phone_number && (
                              <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" />{contact.country_code} {contact.phone_number}</p>
                            )}
                            {contact?.has_whatsapp && contact?.phone_number && (
                              <p className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-green-600" />WhatsApp</p>
                            )}
                            {contact?.has_viber && contact?.phone_number && (
                              <p className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-purple-600" />Viber</p>
                            )}
                            {contact?.has_telegram && contact?.phone_number && (
                              <p className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-blue-500" />Telegram</p>
                            )}
                            {comment.model.model_details[0]?.city && (
                              <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{comment.model.model_details[0].city}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {comment.status !== 'approved' && (
                          <button onClick={() => handleApprove(comment.id)} disabled={processing === comment.id}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors">
                            {processing === comment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Approve</>}
                          </button>
                        )}
                        {comment.status !== 'rejected' && (
                          <button onClick={() => handleReject(comment.id)} disabled={processing === comment.id}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors">
                            {processing === comment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Reject</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
