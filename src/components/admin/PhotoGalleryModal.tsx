'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface Media {
  id: string
  file_name: string
  file_path: string
  uploaded_at: string
  is_approved: boolean | null
  type: 'photo' | 'video'
}

interface PhotoGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  profileId: string
  profileName: string
  profileType: 'model' | 'club'
}

export default function PhotoGalleryModal({
  isOpen,
  onClose,
  profileId,
  profileName,
  profileType
}: PhotoGalleryModalProps) {
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState<Media[]>([])
  const [videos, setVideos] = useState<Media[]>([])
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(new Map())
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadMedia()
    }
  }, [isOpen, profileId])

  const loadMedia = async () => {
    setLoading(true)
    console.log('PhotoGalleryModal - Loading media for:', { profileId, profileType, profileName })
    
    const photosTable = profileType === 'model' ? 'model_photos' : 'club_photos'
    const videosTable = profileType === 'model' ? 'model_videos' : 'club_videos'
    const idColumn = profileType === 'model' ? 'model_id' : 'club_id'

    // Load photos
    const { data: photosData, error: photosError } = await supabase
      .from(photosTable)
      .select('*')
      .eq(idColumn, profileId)
      .order('uploaded_at', { ascending: false })

    console.log('PhotoGalleryModal - Photos loaded:', { photosData, photosError, count: photosData?.length })

    setPhotos(photosData?.map(p => ({ ...p, type: 'photo' as const })) || [])

    // Load videos
    const { data: videosData, error: videosError } = await supabase
      .from(videosTable)
      .select('*')
      .eq(idColumn, profileId)
      .order('uploaded_at', { ascending: false })

    console.log('PhotoGalleryModal - Videos loaded:', { videosData, videosError, count: videosData?.length })

    setVideos(videosData?.map(v => ({ ...v, type: 'video' as const })) || [])

    setLoading(false)
  }

  useEffect(() => {
    const loadUrls = async () => {
      const urls = new Map<string, string>()
      const allMedia = [...photos, ...videos]

      for (const item of allMedia) {
        const bucket = profileType === 'model'
          ? (item.type === 'photo' ? 'model-photos' : 'model-videos')
          : (item.type === 'photo' ? 'club-photos' : 'club-videos')
        
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(item.file_path)

        console.log('Loading media:', { bucket, file_path: item.file_path, url: data.publicUrl })
        if (data) urls.set(item.id, data.publicUrl)
      }

      setMediaUrls(urls)
    }

    if (photos.length > 0 || videos.length > 0) {
      loadUrls()
    }
  }, [photos, videos])

  const handleDeleteMedia = async (item: Media) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu sliku/video? Ova akcija se ne može poništiti.')) {
      return
    }

    const table = profileType === 'model'
      ? (item.type === 'photo' ? 'model_photos' : 'model_videos')
      : (item.type === 'photo' ? 'club_photos' : 'club_videos')
    
    const bucket = profileType === 'model'
      ? (item.type === 'photo' ? 'model-photos' : 'model-videos')
      : (item.type === 'photo' ? 'club-photos' : 'club-videos')

    try {
      // Delete from database first
      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id)

      if (dbError) {
        console.error('DB Error:', dbError)
        throw dbError
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([item.file_path])

      if (storageError) {
        console.error('Storage Error:', storageError)
        // Don't throw - file might already be deleted
      }

      // Reload media
      await loadMedia()
      setSelectedMedia(null)
      alert('Slika/video je uspešno obrisan!')
    } catch (error) {
      console.error('Error deleting media:', error)
      alert('Greška pri brisanju medija. Pokušajte ponovo.')
    }
  }

  const handleToggleApproval = async (item: Media) => {
    const table = profileType === 'model'
      ? (item.type === 'photo' ? 'model_photos' : 'model_videos')
      : (item.type === 'photo' ? 'club_photos' : 'club_videos')

    const newStatus = !item.is_approved

    const { error } = await supabase
      .from(table)
      .update({
        is_approved: newStatus
      })
      .eq('id', item.id)

    if (error) {
      console.error('Toggle approval error:', error)
      alert('Greška pri promeni statusa: ' + error.message)
      return
    }

    await loadMedia()
    setSelectedMedia(null)
    alert(newStatus ? 'Slika je objavljena na sajtu!' : 'Slika je uklonjena sa sajta!')
  }

  if (!isOpen) return null

  const allMedia = [...photos, ...videos]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profileName} - Media</h2>
            <p className="text-gray-600 mt-1">
              {photos.length} slika, {videos.length} videa
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
          ) : allMedia.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Nema uploadovanih slika/videa</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allMedia.map((item) => (
                <div key={item.id} className="relative group">
                  <div 
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => setSelectedMedia(item)}
                  >
                    {mediaUrls.get(item.id) ? (
                      item.type === 'photo' ? (
                        <img
                          src={mediaUrls.get(item.id)}
                          alt={item.file_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={mediaUrls.get(item.id)}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-500 text-sm">Loading...</p>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {item.is_approved === true ? (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                          ✓
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
                          !
                        </span>
                      )}
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteMedia(item)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full view modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-900" />
          </button>

          <div className="max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type === 'photo' ? (
              <img
                src={mediaUrls.get(selectedMedia.id)}
                alt={selectedMedia.file_name}
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={mediaUrls.get(selectedMedia.id)}
                className="w-full h-full object-contain"
                controls
                autoPlay
              />
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-4 justify-center">
              <button
                onClick={() => handleToggleApproval(selectedMedia)}
                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                  selectedMedia.is_approved
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {selectedMedia.is_approved ? (
                  <>
                    <XCircle className="w-5 h-5" />
                    Ukloni sa sajta
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Objavi na sajt
                  </>
                )}
              </button>
              <button
                onClick={() => handleDeleteMedia(selectedMedia)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Obriši zauvek
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
