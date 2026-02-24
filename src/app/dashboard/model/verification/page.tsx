'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Upload, X, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export default function VerificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [user, setUser] = useState<any>(null)
  const [verification, setVerification] = useState<any>(null)

  const [formData, setFormData] = useState({ first_name: '', surname: '', date_of_birth: '', id_number: '' })
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
        if (!user) { router.push('/login'); return }
        setUser(user)
        const { data: verificationData } = await supabase.from('verifications').select('*').eq('user_id', user.id).single()
        if (verificationData) {
          setVerification(verificationData)
          setFormData({ first_name: verificationData.first_name || '', surname: verificationData.surname || '', date_of_birth: verificationData.date_of_birth || '', id_number: verificationData.id_number || '' })
          if (verificationData.id_card_photo_path) {
            const { data } = supabase.storage.from('verification-documents').getPublicUrl(verificationData.id_card_photo_path)
            setIdCardPhotoPreview(data.publicUrl)
          }
          if (verificationData.selfie_photo_path) {
            const { data } = supabase.storage.from('verification-documents').getPublicUrl(verificationData.selfie_photo_path)
            setSelfiePhotoPreview(data.publicUrl)
          }
          if (verificationData.video_path) {
            const { data } = supabase.storage.from('verification-documents').getPublicUrl(verificationData.video_path)
            setIdVideoPreview(data.publicUrl)
          }
        }
        setLoading(false)
      } catch { setLoading(false) }
    }
    loadData()
  }, [router])

  const handleImgChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (u: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp']
    if (!allowed.includes(file.type)) { setSubmitError('Invalid file type. Allowed: jpg, png, gif, bmp, tif, webp'); return }
    setFile(file); setPreview(URL.createObjectURL(file))
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!allowed.includes(file.type)) { setSubmitError('Invalid video type. Allowed: mp4, webm, ogg, mov'); return }
    setIdVideo(file); setIdVideoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(''); setSubmitSuccess('')
    if (!formData.first_name || !formData.surname || !formData.date_of_birth || !formData.id_number) { setSubmitError('Please fill in all required fields'); return }
    if (!idCardPhoto && !verification?.id_card_photo_path) { setSubmitError('Please upload ID Card photo'); return }
    if (!selfiePhoto && !verification?.selfie_photo_path) { setSubmitError('Please upload your photo with ID Card'); return }
    setSubmitting(true)
    try {
      const supabase = createClient()
      let idCardPhotoPath = verification?.id_card_photo_path || ''
      let selfiePhotoPath = verification?.selfie_photo_path || ''
      let videoPath = verification?.video_path || ''
      if (idCardPhoto) {
        const ext = idCardPhoto.name.split('.').pop()
        const path = `${user.email}/id-card-${Date.now()}.${ext}`
        const { error: e } = await supabase.storage.from('verification-documents').upload(path, idCardPhoto, { cacheControl: '3600', upsert: true })
        if (e) throw e; idCardPhotoPath = path
      }
      if (selfiePhoto) {
        const ext = selfiePhoto.name.split('.').pop()
        const path = `${user.email}/selfie-${Date.now()}.${ext}`
        const { error: e } = await supabase.storage.from('verification-documents').upload(path, selfiePhoto, { cacheControl: '3600', upsert: true })
        if (e) throw e; selfiePhotoPath = path
      }
      if (idVideo) {
        const ext = idVideo.name.split('.').pop()
        const path = `${user.email}/video-${Date.now()}.${ext}`
        const { error: e } = await supabase.storage.from('verification-documents').upload(path, idVideo, { cacheControl: '3600', upsert: true })
        if (e) throw e; videoPath = path
      }
      const { error: dbError } = await supabase.from('verifications').upsert({
        user_id: user.id, first_name: formData.first_name, surname: formData.surname,
        date_of_birth: formData.date_of_birth, id_number: formData.id_number,
        id_card_photo_path: idCardPhotoPath, selfie_photo_path: selfiePhotoPath,
        video_path: videoPath || null, status: 'pending', submitted_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (dbError) throw dbError
      setSubmitSuccess('Verification request submitted! Our team will review it within 24-48 hours.')
      const { data: updated } = await supabase.from('verifications').select('*').eq('user_id', user.id).single()
      setVerification(updated)
    } catch (e: any) {
      setSubmitError(e?.message || 'Failed to submit. Please try again.')
    } finally { setSubmitting(false) }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand'
  const labelCls = 'block text-xs font-bold text-gray-800 mb-1'

  const UploadBox = ({ label, desc, preview, setFile, setPreview, inputRef, accept, onFileChange, isVideo = false }: {
    label: string; desc: string; preview: string | null; setFile: (f: File | null) => void; setPreview: (u: string | null) => void;
    inputRef: React.RefObject<HTMLInputElement>; accept: string; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void; isVideo?: boolean
  }) => (
    <div>
      <p className={labelCls}>{label}</p>
      <p className="text-xs text-gray-500 mb-2">{desc}</p>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {preview ? (
          <div className="relative">
            {isVideo
              ? <video src={preview} controls className="w-full h-48 bg-gray-50 object-contain" />
              : <img src={preview} alt="Preview" className="w-full h-48 object-contain bg-gray-50" />
            }
            <button type="button" onClick={() => { setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = '' }}
              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">No file uploaded</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={onFileChange} className="hidden" />
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-full py-2.5 bg-brand text-white text-sm font-bold hover:bg-brand-hover transition-colors">
          Upload File
        </button>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Account Verification</h1>
            <p className="text-xs text-gray-500">Verify your identity to get a verified badge on your profile</p>
          </div>
        </div>

        {/* Status banner */}
        {verification && (
          <div className={`border rounded-lg p-4 flex items-start gap-3 ${
            verification.status === 'approved' ? 'bg-emerald-50 border-emerald-200' :
            verification.status === 'rejected' ? 'bg-red-50 border-red-200' :
            'bg-amber-50 border-amber-200'
          }`}>
            {verification.status === 'approved' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> :
             verification.status === 'rejected' ? <AlertCircle className="w-5 h-5 text-red-600 shrink-0" /> :
             <Clock className="w-5 h-5 text-amber-600 shrink-0" />}
            <div>
              <p className={`text-sm font-bold ${
                verification.status === 'approved' ? 'text-emerald-900' :
                verification.status === 'rejected' ? 'text-red-900' : 'text-amber-900'
              }`}>
                {verification.status === 'approved' ? 'Verified' :
                 verification.status === 'rejected' ? 'Verification Rejected' : 'Verification Pending'}
              </p>
              <p className={`text-xs mt-0.5 ${
                verification.status === 'approved' ? 'text-emerald-700' :
                verification.status === 'rejected' ? 'text-red-700' : 'text-amber-700'
              }`}>
                {verification.status === 'approved' ? 'Your account has been verified!' :
                 verification.status === 'rejected' ? `Reason: ${verification.rejection_reason || 'Please resubmit your documents.'}` :
                 'Under review. Usually takes 24-48 hours.'}
              </p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{submitError}</p>
          </div>
        )}
        {submitSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">{submitSuccess}</p>
          </div>
        )}

        {/* Form */}
        {(!verification || verification.status === 'rejected') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <p className="text-sm font-bold text-gray-800 mb-3">Basic Details <span className="text-xs font-normal text-gray-500">(fields marked with * are mandatory)</span></p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Surname <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.surname} onChange={e => setFormData({ ...formData, surname: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
                  <input type="date" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>ID Number <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.id_number} onChange={e => setFormData({ ...formData, id_number: e.target.value })} className={inputCls} required />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
              <p className="text-sm font-bold text-gray-800">Document Photos</p>
              <UploadBox
                label="ID Card / Passport *"
                desc="Clearly readable photo of National ID (EU) or Passport page with all information"
                preview={idCardPhotoPreview}
                setFile={setIdCardPhoto} setPreview={setIdCardPhotoPreview}
                inputRef={idCardInputRef}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/tiff,image/webp"
                onFileChange={e => handleImgChange(e, setIdCardPhoto, setIdCardPhotoPreview)}
              />
              <UploadBox
                label="Selfie with ID Card *"
                desc="Photo of you holding the document close to your face"
                preview={selfiePhotoPreview}
                setFile={setSelfiePhoto} setPreview={setSelfiePhotoPreview}
                inputRef={selfieInputRef}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/tiff,image/webp"
                onFileChange={e => handleImgChange(e, setSelfiePhoto, setSelfiePhotoPreview)}
              />
              <UploadBox
                label="Video with ID Card (optional)"
                desc="Short video of you holding the document close to your face"
                preview={idVideoPreview}
                setFile={setIdVideo} setPreview={setIdVideoPreview}
                inputRef={videoInputRef}
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                onFileChange={handleVideoChange}
                isVideo
              />
            </div>

            <div className="flex items-center justify-end pb-2">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
                <ShieldCheck className="w-4 h-4" />
                {submitting ? 'Submitting...' : verification ? 'Update Verification' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
