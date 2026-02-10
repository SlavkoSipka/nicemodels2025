'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, CheckCircle, XCircle, User, Phone, Mail, MapPin, Calendar, Loader2, MessageCircle } from 'lucide-react'

interface Comment {
  id: string
  comment_text: string
  rating: number | null
  status: string
  created_at: string
  user: {
    id: string
    username: string
    email: string
    phone: string | null
    city: string | null
    description: string | null
  }
  model: {
    id: string
    username: string
    email: string
    model_details: Array<{
      showname: string
      city: string
    }>
    model_contact_details: Array<{
      phone_number: string
      country_code: string
      has_whatsapp: boolean
      has_viber: boolean
      has_telegram: boolean
    }>
  }
}

export default function CommentsReviewClient({ comments: initialComments }: { comments: Comment[] }) {
  const [comments, setComments] = useState(initialComments)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  console.log('CommentsReviewClient received:', initialComments)

  const handleApprove = async (commentId: string) => {
    setProcessing(commentId)
    const supabase = createClient()

    const { error } = await supabase
      .from('model_comments')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (error) {
      console.error('Error approving comment:', error)
    } else {
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, status: 'approved' } : c
      ))
    }

    setProcessing(null)
  }

  const handleReject = async (commentId: string) => {
    setProcessing(commentId)
    const supabase = createClient()

    const { error } = await supabase
      .from('model_comments')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (error) {
      console.error('Error rejecting comment:', error)
    } else {
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, status: 'rejected' } : c
      ))
    }

    setProcessing(null)
  }

  const filteredComments = filter === 'all' 
    ? comments 
    : comments.filter(c => c.status === filter)

  const pendingCount = comments.filter(c => c.status === 'pending').length
  const approvedCount = comments.filter(c => c.status === 'approved').length
  const rejectedCount = comments.filter(c => c.status === 'rejected').length

  return (
    <div className="ml-[280px] min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Comments Review</h1>
        <p className="text-gray-600">Review and moderate user comments about models</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 text-gray-400" />
            <span className="text-3xl font-bold text-gray-900">{comments.length}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Total Comments</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 text-orange-500" />
            <span className="text-3xl font-bold text-orange-600">{pendingCount}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Pending Review</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-green-600">{approvedCount}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Approved</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-red-600">{rejectedCount}</span>
          </div>
          <p className="text-sm font-semibold text-gray-700">Rejected</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-sm p-2 mb-6 flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            filter === 'pending'
              ? 'bg-orange-100 text-orange-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            filter === 'approved'
              ? 'bg-green-100 text-green-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            filter === 'rejected'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Rejected ({rejectedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All ({comments.length})
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {filteredComments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Comments Found</h3>
            <p className="text-gray-600">
              {filter === 'pending' && 'No pending comments to review'}
              {filter === 'approved' && 'No approved comments yet'}
              {filter === 'rejected' && 'No rejected comments yet'}
              {filter === 'all' && 'No comments have been submitted yet'}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {comment.model.model_details[0]?.showname || comment.model.username}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        comment.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        comment.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {comment.status.toUpperCase()}
                      </span>
                      {comment.rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: comment.rating }).map((_, i) => (
                            <span key={i} className="text-yellow-400">★</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(comment.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Comment Text */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-800 leading-relaxed">{comment.comment_text}</p>
                </div>

                {/* User & Model Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* User Info */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      User Who Commented
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold">{comment.user.username || 'No username'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="break-all">{comment.user.email}</span>
                      </div>
                      {comment.user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{comment.user.phone}</span>
                        </div>
                      )}
                      {comment.user.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{comment.user.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Model Info */}
                  <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-pink-600" />
                      Model Full Contact Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold">{comment.model.model_details[0]?.showname || comment.model.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="break-all">{comment.model.email}</span>
                      </div>
                      {comment.model.model_contact_details[0]?.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>
                            {comment.model.model_contact_details[0].country_code} {comment.model.model_contact_details[0].phone_number}
                          </span>
                        </div>
                      )}
                      {comment.model.model_contact_details[0]?.has_whatsapp && comment.model.model_contact_details[0]?.phone_number && (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <span>WhatsApp: {comment.model.model_contact_details[0].country_code} {comment.model.model_contact_details[0].phone_number}</span>
                        </div>
                      )}
                      {comment.model.model_contact_details[0]?.has_viber && comment.model.model_contact_details[0]?.phone_number && (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-purple-600" />
                          <span>Viber: {comment.model.model_contact_details[0].country_code} {comment.model.model_contact_details[0].phone_number}</span>
                        </div>
                      )}
                      {comment.model.model_contact_details[0]?.has_telegram && comment.model.model_contact_details[0]?.phone_number && (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                          <span>Telegram: {comment.model.model_contact_details[0].country_code} {comment.model.model_contact_details[0].phone_number}</span>
                        </div>
                      )}
                      {comment.model.model_details[0]?.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{comment.model.model_details[0].city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {comment.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(comment.id)}
                      disabled={processing === comment.id}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processing === comment.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(comment.id)}
                      disabled={processing === comment.id}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processing === comment.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
