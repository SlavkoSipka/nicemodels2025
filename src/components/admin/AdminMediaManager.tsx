'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Upload, Trash2, AlertCircle, Film, GripVertical, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react'
import { processImage } from '@/lib/imageProcessor'
import { reorderArray } from '@/lib/reorderArray'

interface MediaItem {
  id: string
  file_name: string
  file_path: string
  is_approved: boolean | null
  display_order?: number | null
  url: string | null
}

interface AdminMediaManagerProps {
  ownerType: 'model' | 'club'
  ownerId: string
  ownerEmail: string
  photos: MediaItem[]
  videos: MediaItem[]
}

const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/x-ms-wmv,video/x-flv,video/x-msvideo,video/x-matroska'
const VIDEO_MIME = ['video/mp4', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/x-msvideo', 'video/x-matroska']

export default function AdminMediaManager({ ownerType, ownerId, ownerEmail, photos: initialPhotos, videos: initialVideos }: AdminMediaManagerProps) {
  const t = useTranslations('admin.mediaManager')
  const [photos, setPhotos] = useState<MediaItem[]>(initialPhotos)
  const [videos, setVideos] = useState<MediaItem[]>(initialVideos)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadingVideos, setUploadingVideos] = useState(false)
  const [error, setError] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const uploadOne = async (file: File, mediaType: 'photo' | 'video'): Promise<MediaItem | null> => {
    const fd = new FormData()
    fd.append('ownerType', ownerType)
    fd.append('mediaType', mediaType)
    fd.append('ownerId', ownerId)
    fd.append('ownerEmail', ownerEmail)
    fd.append('file', file)
    const res = await fetch('/api/admin/sedcard-media', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Upload failed')
    return json.media as MediaItem
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    setUploadingPhotos(true); setError('')
    try {
      for (const raw of files) {
        if (raw.size > 10 * 1024 * 1024) { setError(t('tooLarge', { name: raw.name })); continue }
        const processed = await processImage(raw)
        const media = await uploadOne(processed, 'photo')
        if (media) setPhotos(prev => [...prev, media])
      }
    } catch {
      setError(t('uploadPhotoFailed'))
    } finally { setUploadingPhotos(false); e.target.value = '' }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    setUploadingVideos(true); setError('')
    try {
      for (const file of files) {
        if (file.size > 200 * 1024 * 1024) { setError(t('videoTooLarge', { name: file.name })); continue }
        if (!VIDEO_MIME.includes(file.type)) { setError(t('invalidVideo', { name: file.name })); continue }
        const media = await uploadOne(file, 'video')
        if (media) setVideos(prev => [media, ...prev])
      }
    } catch {
      setError(t('uploadVideoFailed'))
    } finally { setUploadingVideos(false); e.target.value = '' }
  }

  const deleteMedia = async (item: MediaItem, mediaType: 'photo' | 'video') => {
    if (!confirm(mediaType === 'photo' ? t('confirmDeletePhoto') : t('confirmDeleteVideo'))) return
    try {
      const res = await fetch('/api/admin/sedcard-media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerType, mediaType, mediaId: item.id }),
      })
      if (!res.ok) throw new Error()
      if (mediaType === 'photo') setPhotos(prev => prev.filter(p => p.id !== item.id))
      else setVideos(prev => prev.filter(v => v.id !== item.id))
    } catch { setError(t('deleteFailed')) }
  }

  const toggleApproval = async (item: MediaItem, mediaType: 'photo' | 'video') => {
    const isApproved = !item.is_approved
    try {
      const res = await fetch('/api/admin/sedcard-media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approval', ownerType, mediaType, mediaId: item.id, isApproved }),
      })
      if (!res.ok) throw new Error()
      const patch = (m: MediaItem) => m.id === item.id ? { ...m, is_approved: isApproved } : m
      if (mediaType === 'photo') setPhotos(prev => prev.map(patch))
      else setVideos(prev => prev.map(patch))
    } catch { setError(t('updateFailed')) }
  }

  const onDrop = (index: number) => async (e: React.DragEvent) => {
    e.preventDefault()
    const from = dragIndex
    setDragIndex(null)
    if (from === null || from === index) return
    const next = reorderArray(photos, from, index)
    setPhotos(next)
    try {
      const res = await fetch('/api/admin/sedcard-media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', ownerType, orderedIds: next.map(p => p.id) }),
      })
      if (!res.ok) throw new Error()
    } catch { setError(t('reorderFailed')) }
  }

  const badge = (approved: boolean | null) => approved ? (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">{t('published')}</span>
  ) : (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">{t('hidden')}</span>
  )

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Photos */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3 gap-2">
          <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand" /> {t('photos', { count: photos.length })}
          </p>
          <label htmlFor="admin-photo-upload" className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover cursor-pointer shrink-0">
            <Upload className="w-4 h-4" />
            {uploadingPhotos ? t('uploading') : t('uploadPhotos')}
          </label>
          <input id="admin-photo-upload" type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploadingPhotos} className="hidden" />
        </div>
        {photos.length === 0 ? (
          <p className="text-sm text-gray-400">{t('noPhotos')}</p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">{t('dragReorderHint')}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photos.map((p, index) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop(index)}
                  onDragEnd={() => setDragIndex(null)}
                  className={`relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group cursor-grab active:cursor-grabbing ${dragIndex === index ? 'opacity-60 ring-2 ring-brand/40' : ''}`}
                >
                  <div className="absolute top-1 left-1 z-10 bg-black/55 text-white rounded p-0.5 pointer-events-none">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  <div className="aspect-[3/4] bg-gray-100">
                    {p.url && <img src={p.url} alt={p.file_name} className="w-full h-full object-cover pointer-events-none" />}
                  </div>
                  <div className="absolute bottom-1 right-1">{badge(p.is_approved)}</div>
                  <div className="p-1.5 flex gap-1">
                    <button type="button" onClick={() => toggleApproval(p, 'photo')}
                      className="flex-1 px-1 py-1 text-[11px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold flex items-center justify-center gap-1">
                      {p.is_approved ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {p.is_approved ? t('hide') : t('publish')}
                    </button>
                    <button type="button" onClick={() => deleteMedia(p, 'photo')}
                      className="px-1.5 py-1 text-[11px] bg-red-50 text-red-600 rounded hover:bg-red-100 font-semibold flex items-center justify-center">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Videos */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3 gap-2">
          <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Film className="w-4 h-4 text-brand" /> {t('videos', { count: videos.length })}
          </p>
          <label htmlFor="admin-video-upload" className="flex items-center gap-1.5 px-3 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover cursor-pointer shrink-0">
            <Upload className="w-4 h-4" />
            {uploadingVideos ? t('uploading') : t('uploadVideo')}
          </label>
          <input id="admin-video-upload" type="file" accept={VIDEO_ACCEPT} multiple onChange={handleVideoUpload} disabled={uploadingVideos} className="hidden" />
        </div>
        {videos.length === 0 ? (
          <p className="text-sm text-gray-400">{t('noVideos')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {videos.map(v => (
              <div key={v.id} className="relative rounded-lg overflow-hidden bg-gray-900 border border-gray-200 group">
                <div className="aspect-video bg-gray-900">
                  {v.url && <video src={v.url} className="w-full h-full object-cover" controls />}
                </div>
                <div className="absolute top-1 right-1">{badge(v.is_approved)}</div>
                <div className="p-1.5 flex gap-1 bg-white">
                  <button type="button" onClick={() => toggleApproval(v, 'video')}
                    className="flex-1 px-1 py-1 text-[11px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold flex items-center justify-center gap-1">
                    {v.is_approved ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {v.is_approved ? t('hide') : t('publish')}
                  </button>
                  <button type="button" onClick={() => deleteMedia(v, 'video')}
                    className="px-1.5 py-1 text-[11px] bg-red-50 text-red-600 rounded hover:bg-red-100 font-semibold flex items-center justify-center">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
