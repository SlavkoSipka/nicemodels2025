'use client'

import { useEffect, useState } from 'react'
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
            supabase.from('profiles').select('id, email').in('id', ids),
            supabase.from('model_details').select('model_id, showname').in('model_id', ids),
          ])
          const pm = new Map(profiles?.map(p => [p.id, p]) || [])
          const dm = new Map(details?.map(d => [d.model_id, d]) || [])
          allMedia.push(...modelPhotos.map(p => ({ ...p, type: 'photo' as const, owner_email: pm.get(p.model_id)?.email || 'Unknown', owner_type: 'model' as const, owner_name: dm.get(p.model_id)?.showname || 'Unknown', owner_id: p.model_id })))
        }
      }
      if (typeFilter === 'all' || typeFilter === 'videos') {
        const { data: modelVideos } = await supabase.from('model_videos').select('id, file_name, file_path, uploaded_at, is_approved, model_id').order('uploaded_at', { ascending: false })
        if (modelVideos) {
          const ids = [...new Set(modelVideos.map(v => v.model_id))]
          const [{ data: profiles }, { data: details }] = await Promise.all([
            supabase.from('profiles').select('id, email').in('id', ids),
            supabase.from('model_details').select('model_id, showname').in('model_id', ids),
          ])
          const pm = new Map(profiles?.map(p => [p.id, p]) || [])
          const dm = new Map(details?.map(d => [d.model_id, d]) || [])
          allMedia.push(...modelVideos.map(v => ({ ...v, type: 'video' as const, owner_email: pm.get(v.model_id)?.email || 'Unknown', owner_type: 'model' as const, owner_name: dm.get(v.model_id)?.showname || 'Unknown', owner_id: v.model_id })))
        }
      }
    }

    if (ownerFilter === 'all' || ownerFilter === 'clubs') {
      if (typeFilter === 'all' || typeFilter === 'photos') {
        const { data: clubPhotos } = await supabase.from('club_photos').select('id, file_name, file_path, uploaded_at, is_approved, club_id').order('uploaded_at', { ascending: false })
        if (clubPhotos) {
          const ids = [...new Set(clubPhotos.map(p => p.club_id))]
          const [{ data: profiles }, { data: details }] = await Promise.all([
            supabase.from('profiles').select('id, email').in('id', ids),
            supabase.from('club_details').select('club_id, club_name').in('club_id', ids),
          ])
          const pm = new Map(profiles?.map(p => [p.id, p]) || [])
          const dm = new Map(details?.map(d => [d.club_id, d]) || [])
          allMedia.push(...clubPhotos.map(p => ({ ...p, type: 'photo' as const, owner_email: pm.get(p.club_id)?.email || 'Unknown', owner_type: 'club' as const, owner_name: dm.get(p.club_id)?.club_name || 'Unknown', owner_id: p.club_id })))
        }
      }
      if (typeFilter === 'all' || typeFilter === 'videos') {
        const { data: clubVideos } = await supabase.from('club_videos').select('id, file_name, file_path, uploaded_at, is_approved, club_id').order('uploaded_at', { ascending: false })
        if (clubVideos) {
          const ids = [...new Set(clubVideos.map(v => v.club_id))]
          const [{ data: profiles }, { data: details }] = await Promise.all([
            supabase.from('profiles').select('id, email').in('id', ids),
            supabase.from('club_details').select('club_id, club_name').in('club_id', ids),
          ])
          const pm = new Map(profiles?.map(p => [p.id, p]) || [])
          const dm = new Map(details?.map(d => [d.club_id, d]) || [])
          allMedia.push(...clubVideos.map(v => ({ ...v, type: 'video' as const, owner_email: pm.get(v.club_id)?.email || 'Unknown', owner_type: 'club' as const, owner_name: dm.get(v.club_id)?.club_name || 'Unknown', owner_id: v.club_id })))
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
    if (!confirm('Are you sure you want to permanently delete this media?')) return
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-3">
              <ArrowLeft className="w-3 h-3" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Image className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Review Media</h1>
                <p className="text-xs text-gray-500">Manage all photos and videos on the platform</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Status</p>
                <div className="flex gap-1.5">
                  <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterBtn>
                  <FilterBtn active={filter === 'approved'} onClick={() => setFilter('approved')}>Approved</FilterBtn>
                  <FilterBtn active={filter === 'not_approved'} onClick={() => setFilter('not_approved')}>Unapproved</FilterBtn>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Type</p>
                <div className="flex gap-1.5">
                  <FilterBtn active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} color="blue">All</FilterBtn>
                  <FilterBtn active={typeFilter === 'photos'} onClick={() => setTypeFilter('photos')} color="blue">Photos</FilterBtn>
                  <FilterBtn active={typeFilter === 'videos'} onClick={() => setTypeFilter('videos')} color="blue">Videos</FilterBtn>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Owner</p>
                <div className="flex gap-1.5">
                  <FilterBtn active={ownerFilter === 'all'} onClick={() => setOwnerFilter('all')} color="purple">All</FilterBtn>
                  <FilterBtn active={ownerFilter === 'models'} onClick={() => setOwnerFilter('models')} color="purple">Models</FilterBtn>
                  <FilterBtn active={ownerFilter === 'clubs'} onClick={() => setOwnerFilter('clubs')} color="purple">Clubs</FilterBtn>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{mediaItems.length}</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-lg px-4 py-3">
              <p className="text-xs text-emerald-600">Approved</p>
              <p className="text-xl font-bold text-emerald-700">{approvedCount}</p>
            </div>
            <div className="bg-white border border-red-200 rounded-lg px-4 py-3">
              <p className="text-xs text-red-600">Unapproved</p>
              <p className="text-xl font-bold text-red-700">{unapprovedCount}</p>
            </div>
          </div>

          {/* Media Grid */}
          {mediaItems.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg py-12 text-center">
              <Image className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No media matches the selected filters</p>
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
                      <p className="text-xs font-semibold text-gray-900 truncate">{item.owner_name}</p>
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
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMedia(null)}>
          <button onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="bg-black rounded-lg overflow-hidden mb-3">
              {selectedMedia.type === 'photo'
                ? <img src={mediaUrls.get(selectedMedia.id)} alt={selectedMedia.file_name} className="w-full max-h-[70vh] object-contain" />
                : <video src={mediaUrls.get(selectedMedia.id)} className="w-full max-h-[70vh] object-contain" controls autoPlay />}
            </div>

            <div className="bg-white rounded-lg p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                {selectedMedia.owner_type === 'model'
                  ? <User className="w-4 h-4 text-brand" />
                  : <Building2 className="w-4 h-4 text-blue-600" />}
                <p className="text-sm font-bold text-gray-900">{selectedMedia.owner_name}</p>
                <span className="text-xs text-gray-400">{selectedMedia.owner_email}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Uploaded: {new Date(selectedMedia.uploaded_at).toLocaleString()}</span>
                <span>Status: {selectedMedia.is_approved
                  ? <span className="font-semibold text-emerald-600">Published</span>
                  : <span className="font-semibold text-red-600">Not published</span>}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => handleToggle(selectedMedia)}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors ${
                  selectedMedia.is_approved
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}>
                {selectedMedia.is_approved ? 'Unpublish' : 'Approve & Publish'}
              </button>
              <button onClick={() => handleDelete(selectedMedia)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
