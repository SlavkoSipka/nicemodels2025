'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default function VerificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [verification, setVerification] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    first_name: '',
    surname: '',
    date_of_birth: '',
    id_number: '',
  })

  const [idCardPhoto, setIdCardPhoto] = useState<File | null>(null)
  const [idCardPhotoPreview, setIdCardPhotoPreview] = useState<string | null>(null)
  
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null)
  const [selfiePhotoPreview, setSelfiePhotoPreview] = useState<string | null>(null)
  
  const [idVideo, setIdVideo] = useState<File | null>(null)
  const [idVideoPreview, setIdVideoPreview] = useState<string | null>(null)

  const idCardInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        setUser(user)

        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData)

        // Load existing verification data if any
        const { data: verificationData } = await supabase
          .from('verifications')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (verificationData) {
          setVerification(verificationData)
          setFormData({
            first_name: verificationData.first_name || '',
            surname: verificationData.surname || '',
            date_of_birth: verificationData.date_of_birth || '',
            id_number: verificationData.id_number || '',
          })

          // Load existing photos/video from storage
          if (verificationData.id_card_photo_path) {
            const { data } = supabase.storage
              .from('verification-documents')
              .getPublicUrl(verificationData.id_card_photo_path)
            setIdCardPhotoPreview(data.publicUrl)
          }

          if (verificationData.selfie_photo_path) {
            const { data } = supabase.storage
              .from('verification-documents')
              .getPublicUrl(verificationData.selfie_photo_path)
            setSelfiePhotoPreview(data.publicUrl)
          }

          if (verificationData.video_path) {
            const { data } = supabase.storage
              .from('verification-documents')
              .getPublicUrl(verificationData.video_path)
            setIdVideoPreview(data.publicUrl)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading verification data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleIdCardPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Allowed: jpg, png, gif, bmp, tif, webp, jpeg, tiff')
        return
      }

      setIdCardPhoto(file)
      setIdCardPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSelfiePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Allowed: jpg, png, gif, bmp, tif, webp, jpeg, tiff')
        return
      }

      setSelfiePhoto(file)
      setSelfiePhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Allowed: mp4, webm, ogg, mov')
        return
      }

      setIdVideo(file)
      setIdVideoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name || !formData.surname || !formData.date_of_birth || !formData.id_number) {
      alert('Please fill in all required fields')
      return
    }

    if (!idCardPhoto && !verification?.id_card_photo_path) {
      alert('Please upload ID Card photo')
      return
    }

    if (!selfiePhoto && !verification?.selfie_photo_path) {
      alert('Please upload your photo with ID Card')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      let idCardPhotoPath = verification?.id_card_photo_path || ''
      let selfiePhotoPath = verification?.selfie_photo_path || ''
      let videoPath = verification?.video_path || ''

      // Upload ID Card Photo
      if (idCardPhoto) {
        const fileExt = idCardPhoto.name.split('.').pop()
        const fileName = `${user.email}/id-card-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, idCardPhoto, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) throw uploadError
        idCardPhotoPath = fileName
      }

      // Upload Selfie Photo
      if (selfiePhoto) {
        const fileExt = selfiePhoto.name.split('.').pop()
        const fileName = `${user.email}/selfie-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, selfiePhoto, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) throw uploadError
        selfiePhotoPath = fileName
      }

      // Upload Video (optional)
      if (idVideo) {
        const fileExt = idVideo.name.split('.').pop()
        const fileName = `${user.email}/video-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, idVideo, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) throw uploadError
        videoPath = fileName
      }

      // Save verification data
      const verificationData = {
        user_id: user.id,
        first_name: formData.first_name,
        surname: formData.surname,
        date_of_birth: formData.date_of_birth,
        id_number: formData.id_number,
        id_card_photo_path: idCardPhotoPath,
        selfie_photo_path: selfiePhotoPath,
        video_path: videoPath || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      }

      const { error: dbError } = await supabase
        .from('verifications')
        .upsert(verificationData, { onConflict: 'user_id' })

      if (dbError) throw dbError

      alert('✅ Verification request submitted successfully! Our team will review it soon.')
      
      // Reload data
      const { data: updatedVerification } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setVerification(updatedVerification)
      setSubmitting(false)
    } catch (error) {
      console.error('Error submitting verification:', error)
      alert('Failed to submit verification. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <DashboardSidebar userRole="model" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardSidebar userRole="model" />
      <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Verification</h1>
            <p className="text-gray-600">
              Verify your identity to build trust and get a verified badge on your profile
            </p>
          </div>

          {/* Status Banner */}
          {verification && (
            <div className={`mb-6 rounded-xl p-5 ${
              verification.status === 'approved' 
                ? 'bg-green-50 border-2 border-green-200' 
                : verification.status === 'rejected'
                ? 'bg-red-50 border-2 border-red-200'
                : 'bg-yellow-50 border-2 border-yellow-200'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  verification.status === 'approved' 
                    ? 'bg-green-100' 
                    : verification.status === 'rejected'
                    ? 'bg-red-100'
                    : 'bg-yellow-100'
                }`}>
                  {verification.status === 'approved' ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : verification.status === 'rejected' ? (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${
                    verification.status === 'approved' 
                      ? 'text-green-900' 
                      : verification.status === 'rejected'
                      ? 'text-red-900'
                      : 'text-yellow-900'
                  }`}>
                    {verification.status === 'approved' 
                      ? '✓ Verified' 
                      : verification.status === 'rejected'
                      ? 'Verification Rejected'
                      : 'Verification Pending'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    verification.status === 'approved' 
                      ? 'text-green-700' 
                      : verification.status === 'rejected'
                      ? 'text-red-700'
                      : 'text-yellow-700'
                  }`}>
                    {verification.status === 'approved' 
                      ? 'Your account has been verified!' 
                      : verification.status === 'rejected'
                      ? `Reason: ${verification.rejection_reason || 'Please check your documents and resubmit.'}`
                      : 'Your verification is being reviewed by our team. This usually takes 24-48 hours.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form - Only show if no verification or if rejected */}
          {(!verification || verification.status === 'rejected') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Details</h2>
              <p className="text-sm text-gray-600 mb-6">
                Fields marked with <span className="text-red-600 font-bold">*</span> are mandatory.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name & Surname */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Surname <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    required
                  />
                </div>
              </div>

              {/* Date of Birth & ID Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                    required
                  />
                </div>
              </div>

              {/* ID Card Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Card (*or what has been requested) <span className="text-red-600">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Clearly readable photo of National ID for EU citizens or clearly readable photo of the Passport where we can find all the information (for non EU advertisers)
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  <strong>Allowed image types:</strong> jpg, png, gif, bmp, tif, webp, jpeg, tiff
                </p>

                <div className="border-2 border-pink-200 rounded-xl overflow-hidden">
                  {idCardPhotoPreview ? (
                    <div className="relative">
                      <img 
                        src={idCardPhotoPreview} 
                        alt="ID Card Preview" 
                        className="w-full h-64 object-contain bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIdCardPhoto(null)
                          setIdCardPhotoPreview(null)
                          if (idCardInputRef.current) idCardInputRef.current.value = ''
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      <p className="text-gray-500">No image uploaded</p>
                    </div>
                  )}
                  
                  <input
                    ref={idCardInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/tiff,image/webp"
                    onChange={handleIdCardPhotoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => idCardInputRef.current?.click()}
                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold hover:from-pink-700 hover:to-rose-700 transition-all"
                  >
                    FILE UPLOAD
                  </button>
                </div>
              </div>

              {/* Selfie with ID Card */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Photo with ID Card (*or what has been requested) <span className="text-red-600">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Photo of you holding the passport/document close to your face (the same document used for the previous photo)
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  <strong>Allowed image types:</strong> jpg, png, gif, bmp, tif, webp, jpeg, tiff
                </p>

                <div className="border-2 border-pink-200 rounded-xl overflow-hidden">
                  {selfiePhotoPreview ? (
                    <div className="relative">
                      <img 
                        src={selfiePhotoPreview} 
                        alt="Selfie Preview" 
                        className="w-full h-64 object-contain bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelfiePhoto(null)
                          setSelfiePhotoPreview(null)
                          if (selfieInputRef.current) selfieInputRef.current.value = ''
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-gray-500">No image uploaded</p>
                    </div>
                  )}
                  
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/tiff,image/webp"
                    onChange={handleSelfiePhotoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => selfieInputRef.current?.click()}
                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold hover:from-pink-700 hover:to-rose-700 transition-all"
                  >
                    FILE UPLOAD
                  </button>
                </div>
              </div>

              {/* Video with ID Card (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your video with ID Card (*or what has been requested)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Video of you holding the document close to your face (optional)
                </p>

                <div className="border-2 border-pink-200 rounded-xl overflow-hidden">
                  {idVideoPreview ? (
                    <div className="relative">
                      <video 
                        src={idVideoPreview} 
                        controls
                        className="w-full h-64 bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIdVideo(null)
                          setIdVideoPreview(null)
                          if (videoInputRef.current) videoInputRef.current.value = ''
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500">No video uploaded</p>
                    </div>
                  )}
                  
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold hover:from-pink-700 hover:to-rose-700 transition-all"
                  >
                    FILE UPLOAD
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-bold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : verification ? 'Update Verification' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
          )}
        </div>
      </div>
    </>
  )
}
