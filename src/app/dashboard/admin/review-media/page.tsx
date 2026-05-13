'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Trash2, User, Building2, X, Image, CheckCircle, XCircle } from 'lucide-react'

interface MediaItem {
  id: string
  file_name: string
  file_path: string
  uploaded_at: string
  is_approved: boolean | null
  type: 'photo' | 'video'
  owner_email: string
  owner_type: 'model' | 'club'
  owner_name: string
  owner_id: string
}

type StatusFilter = 'all' | 'approved' | 'not_approved'
type TypeFilter = 'all' | 'photos' | 'videos'
type OwnerFilter = 'all' | 'models' | 'clubs'

export default function ReviewMediaPage() {
  const t = useTranslations('admin.reviewMedia')
  const tc = useTranslations('admin.common')
  const [loading, setLoading] = useState(true)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all')
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(new Map())
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const supabase = createClient()

  useEffect(() => { loadMedia() }, [filter, typeFilter, ownerFilter])

  const loadMedia = async () => {
    setLoading(true)

    let allMedia: MediaItem[] = []

    if (ownerFilter === 'all' || ownerFilter === 'models') {
      if (typeFilter === 'all' || typeFilter === 'photos') {
        const { data: modelPhotos } = await supabase.from('model_photos').select('id, file_name, file_path, uploaded_at, is_approved, model_id').order('uploaded_at', { ascending: false })
        if (modelPhotos) {
          const ids = [...new Set(modelPhotos.map(p => p.model_id))]
          const [{ data: profiles }, { data: details }] = await Promise.all([
            supabase.from('profiles').select('id, email, public_id').in('id', ids),
            supabase.from('model_details').select('model_id, showname').in('model_id', ids),
          ])
          const pm = new Map<string, any>(profiles?.map(p => [p.id, p]) || [])
          const dm = new Map<string, any>(details?.map(d => [d.model_id, d]) || [])
          allMedia.push(...modelPhotos.map(p => ({ ...p, type: 'photo' as const, owner_email: pm.get(p.model_id)?.email || 'Unknown', owner_type: 'model' as const, owner_name: dm.get(p.model_id)?.showname || 'Unknown', owner_id: p.model_id, owner_public_id: pm.get(p.model_id)?.public_id || null })))
        }
      }
      if (typeFilter === 'all' || typeFilter === 'videos') {
        const { data: modelVideos } = await supabase.from('model_videos').select('id, file_name, file_path, uploaded_at, is_approved, model_id').order('uploaded_at', { ascending: false })
        if (modelVideos) {
          const ids = [...new Set(modelVideos.map(v => v.model_id))]
          const [{ data: profiles }, { data: details }] = await Promise.all([
            supabase.from('profiles').select('id, email, public_id').in('id', ids),
            supabase.from('model_details').select('model_id, showname').in('model_id', ids),
          ])
          const pm = new Map<string, any>(profiles?.map(p => [p.id, p]) || [])
          const dm = new Map<string, any>(details?.map(d => [d.model_id, d]) || [])
          allMedia.push(...modelVideos.map(v => ({ ...v, type: 'video' as const, owner_email: pm.get(v.model_id)?.email || 'Unknown', owner_type: 'model' as const, owner_name: dm.get(v.model_id)?.showname || 'Unknown', owner_id: v.model_id, owner_public_id: pm.get(v.model_id)?.public_id || null })))
        }
      }
    }

    if (ownerFilter === 'all' || ownerFilter === 'clubs') {
      if (typeFilter === 'all' || typeFilter === 'photos') {
        const { data: clubPhotos } = await supabase.from('club_photos').select('id, file_name, file_path, uploaded_at, is_approved, club_id').order('uploaded_at', { ascending: false })
        if (clubPhotos) {
          const ids = [...new Set(clubPhotos.map(p => p.club_id))]
          const [{ data: profiles }, { data: details }] = await Promise.all([
            supabase.from('profiles').select('id, email, public_id').in('id', ids),
            supabase.from('club_details').select('club_id, club_name').in('club_id', ids),
          ])
          const pm = new Map<string, any>(profiles?.map(p => [p.id, p]) || [])
          const dm = new Map<string, any>(details?.map(d => [d.club_id, d]) || [])
          allMedia.push(...clubPhotos.map(p => ({ ...p, type: 'photo' as const, owner_email: pm.get(p.club_id)?.email || 'Unknown', owner_type: 'club' as const, owner_name: dm.get(p.club_id)?.club_name || 'Unknown', owner_id: p.club_id, owner_public_id: pm.get(p.club_id)?.public_id || null })))
        }
      }
      if (typeFilter === 'all' || typeFilter === 'videos') {
        const { data: clubVideos } = await supabase.from('club_videos').select('id, file_name, file_path, uploaded_at, is_approved, club_id').order('uploaded_at', { ascending: false })
        if (clubVideos) {
          const ids = [...new Set(clubVideos.map(v => v.club_id))]
          const [{ data: profiles }, { data: details }] = await Promise.all([
            supabase.from('profiles').select('id, email, public_id').in('id', ids),
            supabase.from('club_details').select('club_id, club_name').in('club_id', ids),
          ])
          const pm = new Map<string, any>(profiles?.map(p => [p.id, p]) || [])
          const dm = new Map<string, any>(details?.map(d => [d.club_id, d]) || [])
          allMedia.push(...clubVideos.map(v => ({ ...v, type: 'video' as const, owner_email: pm.get(v.club_id)?.email || 'Unknown', owner_type: 'club' as const, owner_name: dm.get(v.club_id)?.club_name || 'Unknown', owner_id: v.club_id, owner_public_id: pm.get(v.club_id)?.public_id || null })))
        }
      }
    }

    let result = allMedia
    if (filter === 'approved') result = allMedia.filter(i => i.is_approved === true)
    else if (filter === 'not_approved') result = allMedia.filter(i => i.is_approved !== true)
    result.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())

    setMediaItems(result)
    setLoading(false)
  }

  useEffect(() => {
    if (mediaItems.length === 0) return
    const urls = new Map<string, string>()
    for (const item of mediaItems) {
      const bucket = item.owner_type === 'model'
        ? (item.type === 'photo' ? 'model-photos' : 'model-videos')
        : (item.type === 'photo' ? 'club-photos' : 'club-videos')
      const { data } = supabase.storage.from(bucket).getPublicUrl(item.file_path)
      if (data) urls.set(item.id, data.publicUrl)
    }
    setMediaUrls(urls)
  }, [mediaItems])

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(t('confirmDelete'))) return
    const table = item.owner_type === 'model' ? (item.type === 'photo' ? 'model_photos' : 'model_videos') : (item.type === 'photo' ? 'club_photos' : 'club_videos')
    const bucket = item.owner_type === 'model' ? (item.type === 'photo' ? 'model-photos' : 'model-videos') : (item.type === 'photo' ? 'club-photos' : 'club-videos')
    try {
      await supabase.storage.from(bucket).remove([item.file_path])
      await supabase.from(table).delete().eq('id', item.id)
      loadMedia()
      setSelectedMedia(null)
    } catch { /* silently fail */ }
  }

  const handleToggle = async (item: MediaItem) => {
    const table = item.owner_type === 'model' ? (item.type === 'photo' ? 'model_photos' : 'model_videos') : (item.type === 'photo' ? 'club_photos' : 'club_videos')
    await supabase.from(table).update({ is_approved: !item.is_approved }).eq('id', item.id)
    loadMedia()
  }

  const approvedCount = mediaItems.filter(m => m.is_approved === true).length
  const unapprovedCount = mediaItems.filter(m => m.is_approved !== true).length

  const FilterBtn = ({ active, onClick, children, color = 'brand' }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
        active
          ? color === 'brand' ? 'bg-brand text-white' : color === 'blue' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}>
      {children}
    </button>
  )

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Image className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{t('title')}</h1>
                <p className="text-xs text-gray-500 truncate">{t('subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">{t('filterStatus')}</p>
                <div className="flex gap-1.5 flex-wrap">
                  <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>{t('all')}</FilterBtn>
                  <FilterBtn active={filter === 'approved'} onClick={() => setFilter('approved')}>{t('approved')}</FilterBtn>
                  <FilterBtn active={filter === 'not_approved'} onClick={() => setFilter('not_approved')}>{t('unapproved')}</FilterBtn>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-gray-200" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">{t('filterType')}</p>
                <div className="flex gap-1.5 flex-wrap">
                  <FilterBtn active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} color="blue">{t('all')}</FilterBtn>
                  <FilterBtn active={typeFilter === 'photos'} onClick={() => setTypeFilter('photos')} color="blue">{t('photos')}</FilterBtn>
                  <FilterBtn active={typeFilter === 'videos'} onClick={() => setTypeFilter('videos')} color="blue">{t('videos')}</FilterBtn>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-gray-200" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">{t('filterOwner')}</p>
                <div className="flex gap-1.5 flex-wrap">
                  <FilterBtn active={ownerFilter === 'all'} onClick={() => setOwnerFilter('all')} color="purple">{t('all')}</FilterBtn>
                  <FilterBtn active={ownerFilter === 'models'} onClick={() => setOwnerFilter('models')} color="purple">{t('models')}</FilterBtn>
                  <FilterBtn active={ownerFilter === 'clubs'} onClick={() => setOwnerFilter('clubs')} color="purple">{t('clubs')}</FilterBtn>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white border border-gray-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
              <p className="text-xs text-gray-500">{t('total')}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{mediaItems.length}</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
              <p className="text-xs text-emerald-600">{t('approved')}</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-700">{approvedCount}</p>
            </div>
            <div className="bg-white border border-red-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
              <p className="text-xs text-red-600">{t('unapproved')}</p>
              <p className="text-lg sm:text-xl font-bold text-red-700">{unapprovedCount}</p>
            </div>
          </div>

          {/* Media Grid */}
          {mediaItems.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg py-12 text-center">
              <Image className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{t('noMediaMatches')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {mediaItems.map(item => (
                <div key={item.id} onClick={() => setSelectedMedia(item)}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all group">
                  <div className="aspect-square bg-gray-100 relative">
                    {mediaUrls.get(item.id) ? (
                      item.type === 'photo'
                        ? <img src={mediaUrls.get(item.id)} alt={item.file_name} className="w-full h-full object-cover" />
                        : <video src={mediaUrls.get(item.id)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5">
                      {item.is_approved === true ? (
                        <span className="flex items-center justify-center w-5 h-5 bg-emerald-500 text-white rounded-full">
                          <CheckCircle className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full">
                          <XCircle className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {item.type === 'video' && (
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded font-medium">VIDEO</span>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      {item.owner_type === 'model'
                        ? <User className="w-3 h-3 text-brand shrink-0" />
                        : <Building2 className="w-3 h-3 text-blue-600 shrink-0" />}
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {item.owner_name}
                        {item.owner_public_id && <span className="ml-1 text-[9px] font-mono text-gray-400">#{item.owner_public_id}</span>}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(item.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full view modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={() => setSelectedMedia(null)}>
          <button onClick={() => setSelectedMedia(null)}
            className="fixed top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="w-full sm:max-w-4xl my-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-black rounded-lg overflow-hidden mb-3">
              {selectedMedia.type === 'photo'
                ? <img src={mediaUrls.get(selectedMedia.id)} alt={selectedMedia.file_name} className="w-full max-h-[70vh] object-contain" />
                : <video src={mediaUrls.get(selectedMedia.id)} className="w-full max-h-[70vh] object-contain" controls autoPlay />}
            </div>

            <div className="bg-white rounded-lg p-3 sm:p-4 mb-3">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {selectedMedia.owner_type === 'model'
                  ? <User className="w-4 h-4 text-brand shrink-0" />
                  : <Building2 className="w-4 h-4 text-blue-600 shrink-0" />}
                <p className="text-sm font-bold text-gray-900 truncate">
                  {selectedMedia.owner_name}
                  {selectedMedia.owner_public_id && <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{selectedMedia.owner_public_id}</span>}
                </p>
                <a href={`mailto:${selectedMedia.owner_email}`} className="text-xs text-gray-400 hover:text-brand hover:underline truncate min-w-0">{selectedMedia.owner_email}</a>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>{t('uploaded')}: {new Date(selectedMedia.uploaded_at).toLocaleString()}</span>
                <span>{tc('status')}: {selectedMedia.is_approved
                  ? <span className="font-semibold text-emerald-600">{t('published')}</span>
                  : <span className="font-semibold text-red-600">{t('notPublished')}</span>}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              <button onClick={() => handleToggle(selectedMedia)}
                className={`px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors ${
                  selectedMedia.is_approved
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}>
                {selectedMedia.is_approved ? t('unpublish') : t('approveAndPublish')}
              </button>
              <button onClick={() => handleDelete(selectedMedia)}
                className="px-4 sm:px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors">
                <Trash2 className="w-4 h-4" /> {tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
