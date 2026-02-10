'use client'

import { useState } from 'react'
import { MessageSquare, Edit, Clock, CheckCircle, XCircle, Star, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Comment {
  id: string
  comment_text: string
  rating: number | null
  status: string
  created_at: string
  model: {
    id: string
    username: string
    model_details: Array<{
      showname: string
      city: string
    }>
  }
}

export default function UserCommentsClient({ comments: initialComments }: { comments: Comment[] }) {
  const [comments, setComments] = useState(initialComments)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const pendingComments = comments.filter(c => c.status === 'pending')
  const approvedComments = comments.filter(c => c.status === 'approved')
  const rejectedComments = comments.filter(c => c.status === 'rejected')

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This will allow you to submit a new review.')) {
      return
    }

    setDeletingId(commentId)
    const supabase = createClient()

    const { error } = await supabase
      .from('model_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment. Please try again.')
    } else {
      setComments(comments.filter(c => c.id !== commentId))
    }

    setDeletingId(null)
  }

  if (comments.length === 0) {
    return (
      <div className="ml-[280px] min-h-screen bg-gray-50">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Comments</h1>
            <p className="text-gray-600">Reviews and feedback you've shared</p>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                No Comments Yet
              </h2>
              <p className="text-gray-600 mb-6">
                You haven't left any reviews yet. Share your experiences to help other users 
                make informed decisions and contribute to our community.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold rounded-lg transition-all shadow-lg"
              >
                <Edit className="w-5 h-5" />
                Browse Models
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-[280px] min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Comments</h1>
          <p className="text-gray-600">Reviews and feedback you've shared</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-orange-500" />
              <span className="text-3xl font-bold text-orange-600">{pendingComments.length}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Pending Review</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold text-green-600">{approvedComments.length}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Approved</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-500" />
              <span className="text-3xl font-bold text-red-600">{rejectedComments.length}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Rejected</p>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link href={`/models/${comment.model.id}`}>
                      <h3 className="text-xl font-bold text-gray-900 hover:text-pink-600 transition-colors">
                        {comment.model.model_details[0]?.showname || comment.model.username}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        comment.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        comment.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {comment.status === 'pending' ? '⏳ Pending Review' :
                         comment.status === 'approved' ? '✓ Approved' :
                         '✗ Rejected'}
                      </span>
                      {comment.rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: comment.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comment Text */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">{comment.comment_text}</p>
                </div>

                {/* Status Message */}
                {comment.status === 'pending' && (
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-700">
                      <strong>Under Review:</strong> Your comment is being reviewed by our administrators and will be published once approved.
                    </p>
                  </div>
                )}
                {comment.status === 'rejected' && (
                  <div className="mt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-red-700">
                        <strong>Not Approved:</strong> This comment did not meet our community guidelines.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingId === comment.id}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === comment.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Comment
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-600 text-center mt-2">
                      Deleting this comment will allow you to submit a new review for this model.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
