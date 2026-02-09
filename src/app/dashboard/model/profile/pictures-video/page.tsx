'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Photo {
  id: string
  file_name: string
  file_path: string
  is_verified: boolean
}

interface Video {
  id: string
  file_name: string
  file_path: string
  is_verified: boolean
}

export default function PicturesVideoPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadingVideos, setUploadingVideos] = useState(false)
  const [error, setError] = useState('')
  
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<Video[]>([])
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    loadMediaFiles()
  }, [])

  const loadMediaFiles = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load photos
      const { data: photos, error: photosError } = await supabase
        .from('model_photos')
        .select('*')
        .eq('model_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (photosError) throw photosError
      setUploadedPhotos(photos || [])

      // Load videos
      const { data: videos, error: videosError } = await supabase
        .from('model_videos')
        .select('*')
        .eq('model_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (videosError) throw videosError
      setUploadedVideos(videos || [])

      // Load preview URLs for photos
      const photoUrls = new Map<string, string>()
      for (const photo of (photos || [])) {
        const { data: urlData } = supabase.storage
          .from('model-photos')
          .getPublicUrl(photo.file_path)
        if (urlData) photoUrls.set(photo.id, urlData.publicUrl)
      }
      setPhotoUrls(photoUrls)

    } catch (err: any) {
      console.error('Error loading media files:', err)
      setError('Failed to load media files')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const files = Array.from(e.target.files)
    setUploadingPhotos(true)
    setError('')
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      for (const file of files) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} is too large. Max size is 10MB.`)
          continue
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.email}/photos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('model-photos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Create metadata record
        const { data: photoData, error: dbError } = await supabase
          .from('model_photos')
          .insert({
            model_id: user.id,
            file_path: filePath,
            file_name: file.name,
            is_approved: true
          })
          .select()
          .single()

        if (dbError) throw dbError

        // Add to uploaded photos
        setUploadedPhotos(prev => [photoData, ...prev])
        
        // Load URL for the new photo
        const { data: urlData } = supabase.storage
          .from('model-photos')
          .getPublicUrl(photoData.file_path)
        if (urlData) {
          setPhotoUrls(prev => new Map(prev).set(photoData.id, urlData.publicUrl))
        }
      }
    } catch (err: any) {
      console.error('Error uploading photos:', err)
      setError('Failed to upload photos. Please try again.')
    } finally {
      setUploadingPhotos(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const files = Array.from(e.target.files)
    setUploadingVideos(true)
    setError('')
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      for (const file of files) {
        // Validate file size (max 200MB)
        if (file.size > 200 * 1024 * 1024) {
          alert(`${file.name} is too large. Max size is 200MB.`)
          continue
        }

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/x-msvideo', 'video/x-matroska']
        if (!allowedTypes.includes(file.type)) {
          alert(`${file.name} is not a valid video format. Allowed: MP4, MOV, WMV, FLV, AVI, MKV.`)
          continue
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.email}/videos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('model-videos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Create metadata record
        const { data: videoData, error: dbError } = await supabase
          .from('model_videos')
          .insert({
            model_id: user.id,
            file_path: filePath,
            file_name: file.name,
            is_approved: true
          })
          .select()
          .single()

        if (dbError) throw dbError

        // Add to uploaded videos
        setUploadedVideos(prev => [videoData, ...prev])
      }
    } catch (err: any) {
      console.error('Error uploading videos:', err)
      setError('Failed to upload videos. Please try again.')
    } finally {
      setUploadingVideos(false)
      // Reset input
      e.target.value = ''
    }
  }

  const deletePhoto = async (photo: Photo) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const supabase = createClient()
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('model-photos')
        .remove([photo.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('model_photos')
        .delete()
        .eq('id', photo.id)

      if (dbError) throw dbError

      // Remove from state
      setUploadedPhotos(prev => prev.filter(p => p.id !== photo.id))
    } catch (err: any) {
      console.error('Error deleting photo:', err)
      alert('Failed to delete photo.')
    }
  }

  const deleteVideo = async (video: Video) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      const supabase = createClient()
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('model-videos')
        .remove([video.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('model_videos')
        .delete()
        .eq('id', video.id)

      if (dbError) throw dbError

      // Remove from state
      setUploadedVideos(prev => prev.filter(v => v.id !== video.id))
    } catch (err: any) {
      console.error('Error deleting video:', err)
      alert('Failed to delete video.')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 ml-[280px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
      <div className="flex-1 p-8 ml-[280px]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Pictures / Video</h1>
            <p className="text-gray-600 mt-2">Manage your photos and videos</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
            {/* Photos Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Photos</h2>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Requirements</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Good quality photos.</li>
                  <li>Photo without sexually explicit content.</li>
                  <li>400 × 600 px for portrait images.</li>
                  <li>500 × 375 px for landscape images.</li>
                </ul>
              </div>

              <div>
                <label htmlFor="photo-upload" className="block">
                  <div className="inline-block px-8 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-all shadow-md text-center cursor-pointer">
                    {uploadingPhotos ? 'UPLOADING...' : 'UPLOAD PHOTO'}
                  </div>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhotos}
                  className="hidden"
                />
              </div>

              {/* Uploaded Photos Grid */}
              {uploadedPhotos.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4">Your gallery is empty</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {uploadedPhotos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className="relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-pink-300 transition-colors"
                    >
                      {/* Photo Preview */}
                      <div className="aspect-square bg-gray-100 relative">
                        {photoUrls.get(photo.id) ? (
                          <img
                            src={photoUrls.get(photo.id)}
                            alt={photo.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-gray-400 text-xs">Loading...</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="p-3">
                        <p className="text-xs font-medium text-gray-900 truncate mb-2">
                          {photo.file_name}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mb-2">
                          ✓ Published
                        </span>
                        <button
                          type="button"
                          onClick={() => deletePhoto(photo)}
                          className="w-full px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 font-semibold transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Videos Section */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Video</h2>
                <p className="text-sm text-gray-700 mb-4">
                  Showing a video in your sedcard makes you unique and spices your profile up! 
                  Even a short and simple video taken by smartphone will raise the number of 
                  visitors on your profile.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Requirements</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Video Max size is 200mb</li>
                  <li>Allowed video formats: MP4, MOV, WMV, FLV, AVI, MKV</li>
                  <li>Explicit nudity is not allowed</li>
                  <li>Min video height is 360px</li>
                </ul>
              </div>

              <div>
                <label htmlFor="video-upload" className="block">
                  <div className="inline-block px-8 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-all shadow-md text-center cursor-pointer">
                    {uploadingVideos ? 'UPLOADING...' : 'UPLOAD VIDEOS'}
                  </div>
                </label>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-ms-wmv,video/x-flv,video/x-msvideo,video/x-matroska"
                  multiple
                  onChange={handleVideoUpload}
                  disabled={uploadingVideos}
                  className="hidden"
                />
              </div>

              {/* Uploaded Videos List */}
              {uploadedVideos.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4">No videos uploaded</p>
              ) : (
                <div className="space-y-3">
                  {uploadedVideos.map((video) => (
                    <div 
                      key={video.id} 
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-pink-300 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {video.file_name}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          ✓ Uploaded
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteVideo(video)}
                        className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-semibold transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <p className="text-sm text-green-900">
                <span className="font-bold">✓ Auto-Publish:</span> All uploaded photos and videos are immediately published on your profile and visible to everyone. 
                Our admin team monitors content and may remove inappropriate material at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
  )
}
