'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageSquare, Star, Calendar, User, MapPin, Lock, ChevronRight, Reply } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Footer from '@/components/layout/Footer'

interface Comment {
  id: string
  comment_text: string
  rating: number | null
  created_at: string
  reply_text: string | null
  replied_at: string | null
  modelPhoto: string | null
  user: {
    id: string
    username: string
    avatar_url?: string | null
  }
  model: {
    id: string
    username: string
    model_details: Array<{
      showname: string
      city: string
    }>
  }
}

export default function CommentsPageClient({ comments }: { comments: Comment[] }) {
  const t = useTranslations('comments.list')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setIsLoggedIn(!!user)
  }

  // Loading state
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fce9f3' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  // Not logged in - show login prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4" style={{ background: '#fce9f3' }}>
        <div className="p-5 sm:p-8 max-w-sm w-full text-center rounded-xl" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5" style={{ background: 'rgba(236,72,153,0.10)' }}>
            <Lock className="w-6 h-6" style={{ color: '#EC4899' }} />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">{t('loginRequired')}</h1>
          <p className="text-sm mb-5 sm:mb-6 text-slate-500">
            {t('loginPrompt')}
          </p>
          <div className="space-y-2">
            <Link
              href="/login?redirect=%2Fcomments"
              className="block w-full py-2.5 px-4 text-white text-sm font-medium rounded-md transition-colors text-center"
              style={{ background: '#EC4899' }}
            >
              {t('logIn')}
            </Link>
            <Link
              href="/register?redirect=%2Fcomments"
              className="block w-full py-2.5 px-4 text-sm font-medium rounded-md transition-colors text-center"
              style={{ border: '1px solid rgba(0,0,0,0.12)', color: '#475569' }}
            >
              {t('createAccount')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Logged in - show comments
  return (
    <>
    <div className="min-h-screen" style={{ background: '#fce9f3' }}>
      <div className="max-w-7xl mx-auto px-3 py-5 sm:px-4 sm:py-10">
        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats - minimal */}
        <div className="flex items-baseline gap-2 mb-5 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
          <span className="text-xl sm:text-2xl font-semibold text-slate-900">{comments.length}</span>
          <span className="text-sm text-slate-500">
            {comments.length === 1 ? t('review') : t('reviews')}
          </span>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-xl" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}>
            <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(12,53,71,0.25)' }} />
            <p className="text-sm font-medium text-slate-700">{t('noReviews')}</p>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>{t('noReviewsHint')}</p>
          </div>
        ) : (
          <ul className="space-y-3 sm:space-y-4">
            {comments.map((comment) => {
              const modelName = comment.model.model_details[0]?.showname || comment.model.username
              const modelCity = comment.model.model_details[0]?.city
              const photoUrl = comment.modelPhoto
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${comment.modelPhoto}`
                : null

              return (
                <li key={comment.id}>
                  <article
                    className="rounded-xl overflow-hidden transition-colors"
                    style={{ background: '#ffffff', border: '1px solid rgba(59,130,246,0.20)', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Model photo */}
                      <Link
                        href={`/models/${comment.model.id}`}
                        className="relative w-full sm:w-56 flex-shrink-0 aspect-[4/3] sm:aspect-[3/4] block"
                        style={{ background: '#e8f4f8', borderRight: '1px solid rgba(59,130,246,0.12)' }}
                      >
                        {photoUrl ? (
                          <Image
                            src={photoUrl}
                            alt={modelName}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 100vw, 224px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <User className="w-12 h-12" style={{ color: 'rgba(0,0,0,0.15)' }} />
                          </div>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="flex-1 p-4 sm:p-5 md:p-7 min-w-0 flex flex-col justify-between gap-3 sm:gap-4">

                        {/* TOP – name, city, rating */}
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <Link
                                href={`/models/${comment.model.id}`}
                                className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 hover:text-pink-500 transition-colors block"
                              >
                                {modelName}
                                {comment.model.public_id && <span className="ml-1.5 text-xs font-mono text-gray-400">#{comment.model.public_id}</span>}
                              </Link>
                              {modelCity && (
                                <p className="flex items-center gap-1.5 text-sm mt-1" style={{ color: '#64748b' }}>
                                  <MapPin className="w-4 h-4 shrink-0" />
                                  {modelCity}
                                </p>
                              )}
                            </div>
                            {comment.rating != null && comment.rating > 0 && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 sm:w-5 sm:h-5 ${i < comment.rating! ? 'fill-amber-400 text-amber-400' : ''}`}
                                    style={i >= comment.rating! ? { color: '#cbd5e1' } : undefined}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* MIDDLE – comment text with quote accent */}
                        <div className="flex-1 flex flex-col justify-center gap-3">
                          <div className="pl-3 sm:pl-4" style={{ borderLeft: '2px solid rgba(236,72,153,0.5)' }}>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" style={{ color: 'rgba(236,72,153,0.35)' }} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                            </svg>
                            <p className="text-sm sm:text-base md:text-lg leading-relaxed" style={{ color: '#334155' }}>
                              {comment.comment_text}
                            </p>
                          </div>

                          {/* Model reply */}
                          {comment.reply_text && (
                            <div className="rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 ml-2 sm:ml-4" style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.18)' }}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Reply className="w-3.5 h-3.5 text-pink-500" />
                                <span className="text-xs font-bold text-pink-500">{t('replied', { modelName })}</span>
                                {comment.replied_at && (
                                  <span className="text-[11px] ml-1" style={{ color: '#94a3b8' }}>
                                    · {new Date(comment.replied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{comment.reply_text}</p>
                            </div>
                          )}
                        </div>

                        {/* BOTTOM – author, date, profile link */}
                        <div
                          className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 pt-3 text-xs sm:text-sm"
                          style={{ borderTop: '1px solid #e2e8f0', color: '#94a3b8' }}
                        >
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0" style={{ background: '#e8f4f8' }}>
                                {comment.user.avatar_url ? (
                                  <img src={comment.user.avatar_url} alt={comment.user.username || ''} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4" style={{ color: '#94a3b8' }} />
                                )}
                              </div>
                              <span className="font-medium" style={{ color: '#475569' }}>{comment.user.username || t('anonymous')}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {new Date(comment.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <Link
                            href={`/models/${comment.model.id}`}
                            className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-md font-semibold text-sm transition-all"
                            style={{ background: 'rgba(59,130,246,0.10)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.25)' }}
                          >
                            {t('viewProfile')}
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
    <Footer />
    </>
  )
}
