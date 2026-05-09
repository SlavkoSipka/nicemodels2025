'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MessageSquare, Edit, Clock, CheckCircle, XCircle, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  comment_text: string
  rating: number | null
  status: string
  created_at: string
  model: {
    id: string
    username: string
    model_details: Array<{ showname: string; city: string }>
  }
}

export default function UserCommentsClient({ comments: initialComments }: { comments: Comment[] }) {
  const t = useTranslations('dashboard.user.comments')
  const [comments, setComments] = useState(initialComments)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const pending = comments.filter(c => c.status === 'pending')
  const approved = comments.filter(c => c.status === 'approved')
  const rejected = comments.filter(c => c.status === 'rejected')

  const handleDelete = async (commentId: string) => {
    if (!confirm(t('deleteConfirm'))) return
    setDeletingId(commentId)
    const supabase = createClient()
    const { error } = await supabase.from('model_comments').delete().eq('id', commentId)
    if (!error) setComments(comments.filter(c => c.id !== commentId))
    setDeletingId(null)
  }

  return (
    <div className="ml-0 md:ml-[280px] min-h-screen bg-gray-50">
      <div className="py-4 md:py-6 px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-xs text-gray-500">{t('subtitle')}</p>
            </div>
          </div>

          {comments.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1">{t('noTitle')}</h2>
              <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                {t('noBody')}
              </p>
              <Link href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover">
                <Edit className="w-4 h-4" />
                {t('browseModels')}
              </Link>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="text-2xl font-bold text-amber-600">{pending.length}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{t('pendingReview')}</p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-2xl font-bold text-emerald-600">{approved.length}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{t('approved')}</p>
                </div>
                <div className="bg-white border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-2xl font-bold text-red-600">{rejected.length}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{t('rejected')}</p>
                </div>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link href={`/models/${comment.model.id}`}>
                            <p className="text-sm font-bold text-gray-900 hover:text-brand transition-colors">
                              {comment.model.model_details[0]?.showname || comment.model.username}
                            </p>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              comment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              comment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {comment.status === 'pending' ? t('statusPending') :
                               comment.status === 'approved' ? t('statusApproved') : t('statusRejected')}
                            </span>
                            {comment.rating && (
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: comment.rating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800">
                        {comment.comment_text}
                      </div>

                      {comment.status === 'pending' && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2.5 py-1.5 mt-2">
                          {t('underReview')}
                        </p>
                      )}
                      {comment.status === 'rejected' && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2.5 py-1.5">
                            {t('notApproved')}
                          </p>
                          <button onClick={() => handleDelete(comment.id)}
                            disabled={deletingId === comment.id}
                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
                            {deletingId === comment.id
                              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('deletingComment')}</>
                              : <><Trash2 className="w-4 h-4" />{t('deleteComment')}</>}
                          </button>
                          <p className="text-xs text-gray-400 text-center">
                            {t('deletingHint')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
