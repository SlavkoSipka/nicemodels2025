'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Upload, Trash2, AlertCircle, Film } from 'lucide-react'
import { processImage } from '@/lib/imageProcessor'

interface Photo { id: string; file_name: string; file_path: string; is_verified: boolean }
interface Video { id: string; file_name: string; file_path: string; is_verified: boolean }

export default function PicturesVideoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadingVideos, setUploadingVideos] = useState(false)
  const [error, setError] = useState('')
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<Video[]>([])
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map())

  useEffect(() => { loadMediaFiles() }, [])

  const loadMediaFiles = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [{ data: photos, error: pe }, { data: videos, error: ve }] = await Promise.all([
        supabase.from('model_photos').select('*').eq('model_id', user.id).order('uploaded_at', { ascending: false }),
        supabase.from('model_videos').select('*').eq('model_id', user.id).order('uploaded_at', { ascending: false })
      ])
      if (pe) throw pe
      if (ve) throw ve
      setUploadedPhotos(photos || [])
      setUploadedVideos(videos || [])
      const urls = new Map<string, string>()
      for (const p of (photos || [])) {
        const { data: u } = supabase.storage.from('model-photos').getPublicUrl(p.file_path)
        if (u) urls.set(p.id, u.publicUrl)
      }
      setPhotoUrls(urls)
    } catch (err: any) {
      setError('Failed to load media files')
    } finally { setLoading(false) }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    setUploadingPhotos(true); setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      for (const rawFile of files) {
        if (rawFile.size > 10 * 1024 * 1024) { setError(`${rawFile.name} is too large. Max 10MB.`); continue }
        const file = await processImage(rawFile)
        const path = `${user.email}/photos/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`
        const { error: ue } = await supabase.storage.from('model-photos').upload(path, file)
        if (ue) throw ue
        const { data: pd, error: de } = await supabase.from('model_photos').insert({ model_id: user.id, file_path: path, file_name: file.name, is_approved: true }).select().single()
        if (de) throw de
        setUploadedPhotos(prev => [pd, ...prev])
        const { data: ud } = supabase.storage.from('model-photos').getPublicUrl(pd.file_path)
        if (ud) setPhotoUrls(prev => new Map(prev).set(pd.id, ud.publicUrl))
      }
    } catch (err: any) {
      setError('Failed to upload photos. Please try again.')
    } finally { setUploadingPhotos(false); e.target.value = '' }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    setUploadingVideos(true); setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const allowed = ['video/mp4', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/x-msvideo', 'video/x-matroska']
      for (const file of files) {
        if (file.size > 200 * 1024 * 1024) { setError(`${file.name} is too large. Max 200MB.`); continue }
        if (!allowed.includes(file.type)) { setError(`${file.name}: invalid video format.`); continue }
        const ext = file.name.split('.').pop()
        const path = `${user.email}/videos/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        const { error: ue } = await supabase.storage.from('model-videos').upload(path, file)
        if (ue) throw ue
        const { data: vd, error: de } = await supabase.from('model_videos').insert({ model_id: user.id, file_path: path, file_name: file.name, is_approved: true }).select().single()
        if (de) throw de
        setUploadedVideos(prev => [vd, ...prev])
      }
    } catch (err: any) {
      setError('Failed to upload video. Please try again.')
    } finally { setUploadingVideos(false); e.target.value = '' }
  }

  const deletePhoto = async (photo: Photo) => {
    if (!confirm('Delete this photo?')) return
    try {
      const supabase = createClient()
      await supabase.storage.from('model-photos').remove([photo.file_path])
      await supabase.from('model_photos').delete().eq('id', photo.id)
      setUploadedPhotos(prev => prev.filter(p => p.id !== photo.id))
    } catch { setError('Failed to delete photo.') }
  }

  const deleteVideo = async (video: Video) => {
    if (!confirm('Delete this video?')) return
    try {
      const supabase = createClient()
      await supabase.storage.from('model-videos').remove([video.file_path])
      await supabase.from('model_videos').delete().eq('id', video.id)
      setUploadedVideos(prev => prev.filter(v => v.id !== video.id))
    } catch { setError('Failed to delete video.') }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pictures / Video</h1>
              <p className="text-xs text-gray-500">Manage your photos and videos</p>
            </div>
          </div>
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-600 hover:text-gray-900">Back</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Photos */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-800">Photos</p>
            <label htmlFor="photo-upload" className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover cursor-pointer">
              <Upload className="w-4 h-4" />
              {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
            </label>
            <input id="photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploadingPhotos} className="hidden" />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-1">Requirements</p>
            <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
              <li>Good quality photos, no explicit content</li>
              <li>Portrait: 400×600 px · Landscape: 500×375 px · Max 10MB</li>
            </ul>
          </div>
          {uploadedPhotos.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No photos uploaded yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {uploadedPhotos.map(photo => (
                <div key={photo.id} className="relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 group">
                  <div className="aspect-square bg-gray-100">
                    {photoUrls.get(photo.id) ? (
                      <img src={photoUrls.get(photo.id)} alt={photo.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-xs text-gray-400">Loading...</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded mb-1">Published</span>
                    <button onClick={() => deletePhoto(photo)}
                      className="w-full px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 font-semibold flex items-center justify-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Videos */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-brand" />
              <p className="text-sm font-bold text-gray-800">Video</p>
            </div>
            <label htmlFor="video-upload" className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover cursor-pointer">
              <Upload className="w-4 h-4" />
              {uploadingVideos ? 'Uploading...' : 'Upload Video'}
            </label>
            <input id="video-upload" type="file" accept="video/mp4,video/quicktime,video/x-ms-wmv,video/x-flv,video/x-msvideo,video/x-matroska" multiple onChange={handleVideoUpload} disabled={uploadingVideos} className="hidden" />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-1">Requirements</p>
            <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
              <li>Max 200MB · Formats: MP4, MOV, WMV, FLV, AVI, MKV</li>
              <li>No explicit nudity · Min height 360px</li>
            </ul>
          </div>
          {uploadedVideos.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No videos uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {uploadedVideos.map(video => (
                <div key={video.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">{video.file_name}</p>
                    <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">Uploaded</span>
                  </div>
                  <button onClick={() => deleteVideo(video)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-xs text-emerald-800">
            <span className="font-bold">Auto-publish:</span> Uploaded content appears on your profile immediately. Our team monitors for policy compliance.
          </p>
        </div>
      </div>
    </div>
  )
}
