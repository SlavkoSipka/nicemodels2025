'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} is too large. Max size is 10MB.`)
          continue
        }
        if (!file.type.startsWith('image/')) {
          setError(`${file.name} is not a valid image file.`)
          continue
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.email}/photos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('club-photos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

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

      const { error: storageError } = await supabase.storage
        .from('club-photos')
        .remove([filePath])

      if (storageError) throw storageError

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header — dashboard style */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Club Photos</h1>
              <p className="text-xs text-gray-500">Upload and manage photos of your club</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/company')}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">{success}</p>
          </div>
        )}

        {/* Upload + requirements in one card */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <p className="text-sm font-bold text-gray-800">Upload photos</p>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center hover:border-gray-300 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                <Upload className="w-6 h-6 text-brand" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold text-gray-900">JPG, PNG or WEBP · Max 10MB per file</p>
                <p className="text-xs text-gray-500 mt-0.5">High-quality photos of your venue work best</p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50">
                <Upload className="w-4 h-4" />
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
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">Requirements</p>
            <ul className="text-xs text-gray-600 space-y-0.5">
              <li>· Photos must show your actual club/venue</li>
              <li>· No watermarks or logos from other sites</li>
              <li>· Photos may be reviewed before going live</li>
            </ul>
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-bold text-gray-800 mb-3">Your photos ({photos.length})</p>

          {photos.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
              <ImageIcon className="mx-auto w-10 h-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-600 mt-2">No photos yet</p>
              <p className="text-xs text-gray-500 mt-0.5">Upload your first club photos above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <img
                    src={getPhotoUrl(photo.file_path)}
                    alt={photo.file_name}
                    className="w-full h-full object-cover"
                  />
                  {photo.is_approved ? (
                    <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      OK
                    </span>
                  ) : (
                    <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Pending
                    </span>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(photo.id, photo.file_path)}
                    className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
