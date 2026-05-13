'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('admin.photoGallery')
  const tc = useTranslations('admin.common')
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
    if (!confirm(t('confirmDelete'))) {
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
      alert(t('deleteSuccess'))
    } catch (error) {
      console.error('Error deleting media:', error)
      alert(t('deleteError'))
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
      alert(t('statusError', { message: error.message }))
      return
    }

    await loadMedia()
    setSelectedMedia(null)
    alert(newStatus ? t('publishedSuccess') : t('removedSuccess'))
  }

  if (!isOpen) return null

  const allMedia = [...photos, ...videos]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-stretch sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:rounded-xl sm:max-w-7xl sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{profileName} - {t('media')}</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
              {t('photoVideoCount', { photos: photos.length, videos: videos.length })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
          ) : allMedia.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">{t('noMediaUploaded')}</p>
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
                        <p className="text-gray-500 text-sm">{t('loading')}</p>
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
                        {t('delete')}
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
          className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-2 sm:p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-6 h-6 text-gray-900" />
          </button>

          <div className="w-full max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
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
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-center">
              <button
                onClick={() => handleToggleApproval(selectedMedia)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                  selectedMedia.is_approved
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {selectedMedia.is_approved ? (
                  <>
                    <XCircle className="w-5 h-5" />
                    {t('removeFromSite')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {t('publishToSite')}
                  </>
                )}
              </button>
              <button
                onClick={() => handleDeleteMedia(selectedMedia)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                {t('deleteForever')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
