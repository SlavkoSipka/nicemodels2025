'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageSquare, Star, Calendar, User, MapPin, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  // Not logged in - show login prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-pink-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Login Required</h1>
          <p className="text-gray-600 mb-8">
            You need to be logged in to view user reviews and comments. Create an account or log in to continue.
          </p>
          <div className="space-y-3">
            <Link
              href="/register?redirect=%2Fcomments"
              className="block w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold rounded-lg transition-all shadow-lg text-center"
            >
              Create Account
            </Link>
            <Link
              href="/login?redirect=%2Fcomments"
              className="block w-full py-3 px-4 border-2 border-pink-600 text-pink-600 hover:bg-pink-50 font-bold rounded-lg transition-all text-center"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Logged in - show comments
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center gap-3">
            <MessageSquare className="w-10 h-10 text-pink-600" />
            User Reviews & Comments
          </h1>
          <p className="text-gray-600 text-lg">
            Authentic experiences shared by our community members
          </p>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border-2 border-pink-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{comments.length}</p>
            </div>
            <div className="p-4 bg-white rounded-xl">
              <MessageSquare className="w-8 h-8 text-pink-600" />
            </div>
          </div>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Comments Yet</h3>
            <p className="text-gray-600">
              Be the first to share your experience!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {comments.map((comment) => {
              const modelName = comment.model.model_details[0]?.showname || comment.model.username
              const modelCity = comment.model.model_details[0]?.city
              const photoUrl = comment.modelPhoto 
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${comment.modelPhoto}`
                : null

              return (
                <div key={comment.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    {/* Model Photo */}
                    <Link 
                      href={`/models/${comment.model.id}`}
                      className="w-full md:w-48 h-64 md:h-auto bg-gradient-to-br from-pink-100 to-rose-100 relative flex-shrink-0 group"
                    >
                      {photoUrl ? (
                        <Image
                          src={photoUrl}
                          alt={modelName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 192px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <User className="w-16 h-16 text-pink-300" />
                        </div>
                      )}
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          View Profile
                        </span>
                      </div>
                    </Link>

                    {/* Comment Content */}
                    <div className="flex-1 p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Link 
                            href={`/models/${comment.model.id}`}
                            className="text-2xl font-bold text-gray-900 hover:text-pink-600 transition-colors"
                          >
                            {modelName}
                          </Link>
                          {modelCity && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <MapPin className="w-4 h-4" />
                              {modelCity}
                            </div>
                          )}
                        </div>
                        {comment.rating && (
                          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                            {Array.from({ length: comment.rating }).map((_, i) => (
                              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Comment Text */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-800 leading-relaxed">{comment.comment_text}</p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{comment.user.username || 'Anonymous'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(comment.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/models/${comment.model.id}`}
                          className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold rounded-lg transition-all shadow-sm"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
