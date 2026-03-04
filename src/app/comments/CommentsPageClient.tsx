'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageSquare, Star, Calendar, User, MapPin, Lock, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Footer from '@/components/layout/Footer'

interface Comment {
  id: string
  comment_text: string
  rating: number | null
  created_at: string
  modelPhoto: string | null
  user: {
    id: string
    username: string
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 370px, #1f2126 370px)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  // Not logged in - show login prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 370px, #1f2126 370px)' }}>
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6 text-gray-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Login required</h1>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to view reviews and comments.
          </p>
          <div className="space-y-2">
            <Link
              href="/login?redirect=%2Fcomments"
              className="block w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors text-center"
            >
              Log in
            </Link>
            <Link
              href="/register?redirect=%2Fcomments"
              className="block w-full py-2.5 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-md transition-colors text-center"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Logged in - show comments
  return (
    <>
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 370px, #1f2126 370px)' }}>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Reviews & Comments
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Community experiences
          </p>
        </div>

        {/* Stats - minimal */}
        <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-white/15">
          <span className="text-2xl font-semibold text-white">{comments.length}</span>
          <span className="text-sm text-white/60">
            {comments.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">No reviews yet</p>
            <p className="text-sm text-gray-500 mt-1">Be the first to share your experience.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => {
              const modelName = comment.model.model_details[0]?.showname || comment.model.username
              const modelCity = comment.model.model_details[0]?.city
              const photoUrl = comment.modelPhoto
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${comment.modelPhoto}`
                : null

              return (
                <li key={comment.id}>
                  <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                    <div className="flex flex-col sm:flex-row">
                      {/* Model photo - vertical / phone aspect, full image visible */}
                      <Link
                        href={`/models/${comment.model.id}`}
                        className="relative w-full sm:w-56 flex-shrink-0 aspect-[3/4] bg-gray-100 block"
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
                            <User className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="flex-1 p-5 sm:p-7 min-w-0 flex flex-col justify-between gap-4">

                        {/* TOP – name, city, rating */}
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <Link
                                href={`/models/${comment.model.id}`}
                                className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-brand transition-colors block"
                              >
                                {modelName}
                              </Link>
                              {modelCity && (
                                <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
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
                                    className={`w-5 h-5 ${i < comment.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* MIDDLE – comment text with quote accent */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="border-l-2 border-brand/40 pl-4">
                            <svg className="w-6 h-6 text-brand/30 mb-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                            </svg>
                            <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                              {comment.comment_text}
                            </p>
                          </div>
                        </div>

                        {/* BOTTOM – author, date, profile link */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-400" />
                              </div>
                              <span className="font-medium text-gray-700">{comment.user.username || 'Anonymous'}</span>
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
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-gray-100 hover:bg-brand hover:text-white text-gray-700 font-semibold text-sm transition-all"
                          >
                            View Profile
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
