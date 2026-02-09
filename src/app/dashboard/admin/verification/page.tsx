'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, User, Building2, Calendar, FileText } from 'lucide-react'

interface Verification {
  id: string
  user_id: string
  first_name: string
  surname: string
  date_of_birth: string
  id_number: string
  id_card_photo_path: string
  selfie_photo_path: string
  video_path: string | null
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
  profile?: {
    email: string
    username: string
    role: string
    model_details?: {
      showname: string
    } | null
    club_details?: {
      club_name: string
    } | null
  }
}

export default function AdminVerificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [idCardUrl, setIdCardUrl] = useState('')
  const [selfieUrl, setSelfieUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadVerifications()
  }, [])

  // Load signed URLs when verification is selected
  useEffect(() => {
    const loadSignedUrls = async () => {
      if (!selectedVerification) {
        setIdCardUrl('')
        setSelfieUrl('')
        setVideoUrl('')
        return
      }

      // ID Card Photo
      const { data: idData } = await supabase.storage
        .from('verification-documents')
        .createSignedUrl(selectedVerification.id_card_photo_path, 3600)
      if (idData) setIdCardUrl(idData.signedUrl)

      // Selfie Photo
      const { data: selfieData } = await supabase.storage
        .from('verification-documents')
        .createSignedUrl(selectedVerification.selfie_photo_path, 3600)
      if (selfieData) setSelfieUrl(selfieData.signedUrl)

      // Video (optional)
      if (selectedVerification.video_path) {
        const { data: videoData } = await supabase.storage
          .from('verification-documents')
          .createSignedUrl(selectedVerification.video_path, 3600)
        if (videoData) setVideoUrl(videoData.signedUrl)
      }
    }

    loadSignedUrls()
  }, [selectedVerification, supabase])

  const loadVerifications = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    // Load all verifications
    const { data: verificationsData } = await supabase
      .from('verifications')
      .select('*')
      .order('submitted_at', { ascending: false })

    // Load profile data for each verification
    if (verificationsData && verificationsData.length > 0) {
      const verificationWithProfiles = await Promise.all(
        verificationsData.map(async (verification) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select(`
              email,
              username,
              role,
              model_details (showname),
              club_details (club_name)
            `)
            .eq('id', verification.user_id)
            .single()

          // Transform model_details and club_details if they're arrays
          const transformedProfile = profileData ? {
            ...profileData,
            model_details: Array.isArray(profileData.model_details) 
              ? profileData.model_details[0] 
              : profileData.model_details,
            club_details: Array.isArray(profileData.club_details)
              ? profileData.club_details[0]
              : profileData.club_details
          } : null

          return {
            ...verification,
            profile: transformedProfile
          }
        })
      )

      setVerifications(verificationWithProfiles)
    } else {
      setVerifications([])
    }

    setLoading(false)
  }

  const handleApprove = async (verificationId: string, userId: string) => {
    setProcessing(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    try {
      // Update verification status
      const { error: verificationError } = await supabase
        .from('verifications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: null,
        })
        .eq('id', verificationId)

      if (verificationError) throw verificationError

      // Update profile is_verified
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId)

      if (profileError) throw profileError

      alert('✅ Verification approved successfully!')
      setSelectedVerification(null)
      loadVerifications()
    } catch (error) {
      alert('Failed to approve verification')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (verificationId: string, userId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setProcessing(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    try {
      // Update verification status
      const { error: verificationError } = await supabase
        .from('verifications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: rejectionReason,
        })
        .eq('id', verificationId)

      if (verificationError) throw verificationError

      // Update profile is_verified
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: false })
        .eq('id', userId)

      if (profileError) throw profileError

      alert('❌ Verification rejected')
      setSelectedVerification(null)
      setRejectionReason('')
      loadVerifications()
    } catch (error) {
      alert('Failed to reject verification')
    } finally {
      setProcessing(false)
    }
  }

  const filteredVerifications = verifications.filter(v => {
    if (filter === 'all') return true
    return v.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/admin" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Requests</h1>
          <p className="text-gray-600">Review and approve identity verification requests</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all' 
                ? 'bg-pink-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({verifications.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'pending' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending ({verifications.filter(v => v.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'approved' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Approved ({verifications.filter(v => v.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'rejected' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Rejected ({verifications.filter(v => v.status === 'rejected').length})
          </button>
        </div>

        {/* Verifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredVerifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No verification requests found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVerifications.map((verification) => (
                    <tr key={verification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                            {verification.profile?.role === 'model' ? (
                              <User className="w-5 h-5 text-pink-600" />
                            ) : (
                              <Building2 className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {verification.profile?.model_details?.showname || 
                               verification.profile?.club_details?.club_name ||
                               verification.profile?.username || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">{verification.profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          verification.profile?.role === 'model' 
                            ? 'bg-pink-100 text-pink-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {verification.profile?.role === 'model' ? 'Model' : verification.profile?.role === 'company' ? 'Club' : verification.profile?.role || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {verification.first_name} {verification.surname}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(verification.submitted_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          verification.status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : verification.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedVerification(verification)}
                          className="text-pink-600 hover:text-pink-700 font-semibold text-sm"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedVerification && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedVerification(null)
            setRejectionReason('')
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Review Verification Request</h2>
            </div>
            
            <div className="p-6">
              {/* User Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-semibold">{selectedVerification.profile?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Username:</span>
                    <span className="ml-2 font-semibold">@{selectedVerification.profile?.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-semibold">{selectedVerification.profile?.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <span className="ml-2 font-semibold">{new Date(selectedVerification.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Verification Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Submitted Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">First Name:</span>
                    <span className="ml-2 font-semibold">{selectedVerification.first_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Surname:</span>
                    <span className="ml-2 font-semibold">{selectedVerification.surname}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="ml-2 font-semibold">{selectedVerification.date_of_birth}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ID Number:</span>
                    <span className="ml-2 font-semibold">{selectedVerification.id_number}</span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* ID Card Photo */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">ID Card Photo</p>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      {idCardUrl ? (
                        <img
                          src={idCardUrl}
                          alt="ID Card"
                          className="w-full h-48 object-contain bg-gray-50"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-50 flex items-center justify-center">
                          <p className="text-gray-500">Loading...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selfie Photo */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Selfie with ID</p>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      {selfieUrl ? (
                        <img
                          src={selfieUrl}
                          alt="Selfie"
                          className="w-full h-48 object-contain bg-gray-50"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-50 flex items-center justify-center">
                          <p className="text-gray-500">Loading...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video (if uploaded) */}
                {selectedVerification.video_path && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Video with ID</p>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      {videoUrl ? (
                        <video
                          src={videoUrl}
                          controls
                          className="w-full h-48 bg-gray-50"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-50 flex items-center justify-center">
                          <p className="text-gray-500">Loading...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Rejection Reason (if applicable) */}
              {selectedVerification.status === 'rejected' && selectedVerification.rejection_reason && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">Rejection Reason</h3>
                  <p className="text-sm text-red-700">{selectedVerification.rejection_reason}</p>
                </div>
              )}

              {/* Rejection Reason Input (for pending reviews) */}
              {selectedVerification.status === 'pending' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSelectedVerification(null)
                    setRejectionReason('')
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  disabled={processing}
                >
                  Close
                </button>
                
                {selectedVerification.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReject(selectedVerification.id, selectedVerification.user_id)}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedVerification.id, selectedVerification.user_id)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
