'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CompanySidebar from '@/components/layout/CompanySidebar'
import { Image as ImageIcon, Upload, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

interface Photo {
  id: string
  file_name: string
  file_path: string
  is_approved: boolean
  uploaded_at: string
}

export default function ClubPhotosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      await loadPhotos(user.id)
      setLoading(false)
    }

    loadData()
  }, [router])

  const loadPhotos = async (userId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('club_photos')
      .select('*')
      .eq('club_id', userId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error loading photos:', error)
    } else {
      setPhotos(data || [])
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()

      for (const file of files) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} is too large. Max size is 10MB.`)
          continue
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError(`${file.name} is not a valid image file.`)
          continue
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.email}/photos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('club-photos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Create metadata record
        const { error: dbError } = await supabase
          .from('club_photos')
          .insert({
            club_id: user.id,
            file_path: filePath,
            file_name: file.name,
            is_approved: true
          })

        if (dbError) throw dbError
      }

      setSuccess('Photos uploaded successfully!')
      setTimeout(() => setSuccess(''), 3000)
      await loadPhotos(user.id)
    } catch (err: any) {
      setError(err.message || 'Failed to upload photos. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const supabase = createClient()

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('club-photos')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('club_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      setPhotos(photos.filter(p => p.id !== photoId))
      setSuccess('Photo deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete photo. Please try again.')
    }
  }

  const getPhotoUrl = (filePath: string) => {
    const supabase = createClient()
    const { data } = supabase.storage
      .from('club-photos')
      .getPublicUrl(filePath)
    return data.publicUrl
  }

  if (loading) {
    return (
      <>
        <CompanySidebar />
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
      <CompanySidebar />
      <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-100 rounded-lg p-2">
                <ImageIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Club Photos</h1>
            </div>
            <p className="text-gray-600">Upload and manage photos of your club to attract more visitors</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upload New Photos</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-400 transition-all">
              <div className="flex flex-col items-center">
                <div className="bg-pink-100 rounded-full p-4 mb-4">
                  <Upload className="w-8 h-8 text-pink-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Club Photos
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  JPG, PNG or WEBP • Max 10MB per file
                </p>
                
                <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg">
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Uploading...' : 'Choose Photos'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Photo Requirements:</p>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
                    <li>• High-quality photos showcase your venue best</li>
                    <li>• Photos must show your actual club/venue</li>
                    <li>• No watermarks or logos from other websites</li>
                    <li>• Photos will be reviewed before going live</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Your Photos ({photos.length})</h3>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-gray-400 mb-4">
                  <ImageIcon className="mx-auto h-12 w-12" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No photos yet</h4>
                <p className="text-gray-600">Upload your first club photos to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-pink-400 transition-all"
                  >
                    <img
                      src={getPhotoUrl(photo.file_path)}
                      alt={photo.file_name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Status Badge */}
                    {photo.is_approved ? (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Approved
                      </div>
                    ) : (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        Pending Review
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeletePhoto(photo.id, photo.file_path)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-end">
                      <div className="w-full p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all">
                        <p className="text-white text-xs font-medium truncate">{photo.file_name}</p>
                        <p className="text-white/80 text-[10px]">
                          {new Date(photo.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/dashboard/company')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
