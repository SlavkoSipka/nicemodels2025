'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Trash2, User, Building2, X } from 'lucide-react'

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

export default function ReviewMediaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filter, setFilter] = useState<'all' | 'approved' | 'not_approved'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'photos' | 'videos'>('all')
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'models' | 'clubs'>('all')
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(new Map())
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMedia()
  }, [filter, typeFilter, ownerFilter])

  const loadMedia = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    let allMedia: MediaItem[] = []

    // Load model photos/videos
    if (ownerFilter === 'all' || ownerFilter === 'models') {
      if (typeFilter === 'all' || typeFilter === 'photos') {
        const { data: modelPhotos } = await supabase
          .from('model_photos')
          .select(`
            id,
            file_name,
            file_path,
            uploaded_at,
            is_approved,
            model_id
          `)
          .order('uploaded_at', { ascending: false })

        if (modelPhotos) {
          const modelIds = [...new Set(modelPhotos.map(p => p.model_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', modelIds)

          const { data: modelDetails } = await supabase
            .from('model_details')
            .select('model_id, showname')
            .in('model_id', modelIds)

          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
          const detailsMap = new Map(modelDetails?.map(d => [d.model_id, d]) || [])

          allMedia.push(...modelPhotos.map(photo => ({
            ...photo,
            type: 'photo' as const,
            owner_email: profilesMap.get(photo.model_id)?.email || 'Unknown',
            owner_type: 'model' as const,
            owner_name: detailsMap.get(photo.model_id)?.showname || 'Unknown',
            owner_id: photo.model_id
          })))
        }
      }

      if (typeFilter === 'all' || typeFilter === 'videos') {
        const { data: modelVideos } = await supabase
          .from('model_videos')
          .select(`
            id,
            file_name,
            file_path,
            uploaded_at,
            is_approved,
            model_id
          `)
          .order('uploaded_at', { ascending: false })

        if (modelVideos) {
          const modelIds = [...new Set(modelVideos.map(v => v.model_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', modelIds)

          const { data: modelDetails } = await supabase
            .from('model_details')
            .select('model_id, showname')
            .in('model_id', modelIds)

          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
          const detailsMap = new Map(modelDetails?.map(d => [d.model_id, d]) || [])

          allMedia.push(...modelVideos.map(video => ({
            ...video,
            type: 'video' as const,
            owner_email: profilesMap.get(video.model_id)?.email || 'Unknown',
            owner_type: 'model' as const,
            owner_name: detailsMap.get(video.model_id)?.showname || 'Unknown',
            owner_id: video.model_id
          })))
        }
      }
    }

    // Load club photos/videos
    if (ownerFilter === 'all' || ownerFilter === 'clubs') {
      if (typeFilter === 'all' || typeFilter === 'photos') {
        const { data: clubPhotos } = await supabase
          .from('club_photos')
          .select(`
            id,
            file_name,
            file_path,
            uploaded_at,
            is_approved,
            club_id
          `)
          .order('uploaded_at', { ascending: false })

        if (clubPhotos) {
          const clubIds = [...new Set(clubPhotos.map(p => p.club_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', clubIds)

          const { data: clubDetails } = await supabase
            .from('club_details')
            .select('club_id, club_name')
            .in('club_id', clubIds)

          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
          const detailsMap = new Map(clubDetails?.map(d => [d.club_id, d]) || [])

          allMedia.push(...clubPhotos.map(photo => ({
            ...photo,
            type: 'photo' as const,
            owner_email: profilesMap.get(photo.club_id)?.email || 'Unknown',
            owner_type: 'club' as const,
            owner_name: detailsMap.get(photo.club_id)?.club_name || 'Unknown',
            owner_id: photo.club_id
          })))
        }
      }

      if (typeFilter === 'all' || typeFilter === 'videos') {
        const { data: clubVideos } = await supabase
          .from('club_videos')
          .select(`
            id,
            file_name,
            file_path,
            uploaded_at,
            is_approved,
            club_id
          `)
          .order('uploaded_at', { ascending: false })

        if (clubVideos) {
          const clubIds = [...new Set(clubVideos.map(v => v.club_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', clubIds)

          const { data: clubDetails } = await supabase
            .from('club_details')
            .select('club_id, club_name')
            .in('club_id', clubIds)

          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
          const detailsMap = new Map(clubDetails?.map(d => [d.club_id, d]) || [])

          allMedia.push(...clubVideos.map(video => ({
            ...video,
            type: 'video' as const,
            owner_email: profilesMap.get(video.club_id)?.email || 'Unknown',
            owner_type: 'club' as const,
            owner_name: detailsMap.get(video.club_id)?.club_name || 'Unknown',
            owner_id: video.club_id
          })))
        }
      }
    }

    // Apply filter
    let filtered = allMedia
    if (filter === 'approved') {
      filtered = allMedia.filter(item => item.is_approved === true)
    } else if (filter === 'not_approved') {
      filtered = allMedia.filter(item => item.is_approved !== true)
    }

    // Sort by uploaded_at descending
    filtered.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())

    setMediaItems(filtered)
    setLoading(false)
  }

  useEffect(() => {
    const loadMediaUrls = async () => {
      const urls = new Map<string, string>()
      
      for (const item of mediaItems) {
        const bucket = item.owner_type === 'model'
          ? (item.type === 'photo' ? 'model-photos' : 'model-videos')
          : (item.type === 'photo' ? 'club-photos' : 'club-videos')
        
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(item.file_path)
        
        console.log('Review media - Loading:', { bucket, file_path: item.file_path, url: data.publicUrl })
        if (data) {
          urls.set(item.id, data.publicUrl)
        }
      }
      
      setMediaUrls(urls)
    }
    
    if (mediaItems.length > 0) {
      loadMediaUrls()
    }
  }, [mediaItems])

  const handleDeleteMedia = async (item: MediaItem) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj medij? Ova akcija se ne može poništiti.')) {
      return
    }

    const table = item.owner_type === 'model'
      ? (item.type === 'photo' ? 'model_photos' : 'model_videos')
      : (item.type === 'photo' ? 'club_photos' : 'club_videos')
    
    const bucket = item.owner_type === 'model'
      ? (item.type === 'photo' ? 'model-photos' : 'model-videos')
      : (item.type === 'photo' ? 'club-photos' : 'club-videos')

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([item.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id)

      if (dbError) throw dbError

      loadMedia()
      setSelectedMedia(null)
      alert('Medij je uspešno obrisan!')
    } catch (error) {
      console.error('Error deleting media:', error)
      alert('Greška pri brisanju medija.')
    }
  }

  const handleToggleApproval = async (item: MediaItem) => {
    const table = item.owner_type === 'model'
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
      alert('Greška pri promeni statusa')
      return
    }

    loadMedia()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/admin" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review All Media</h1>
          <p className="text-gray-600">Pregled i upravljanje svim slikama i videima</p>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <div className="flex gap-2">
                {['all', 'approved', 'not_approved'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      filter === f
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'all' ? 'Svi' : f === 'approved' ? 'Objavljeni' : 'Neodobreni'}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tip</label>
              <div className="flex gap-2">
                {['all', 'photos', 'videos'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f as any)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      typeFilter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'all' ? 'Sve' : f === 'photos' ? 'Slike' : 'Videi'}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vlasnik</label>
              <div className="flex gap-2">
                {['all', 'models', 'clubs'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setOwnerFilter(f as any)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                      ownerFilter === f
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'all' ? 'Svi' : f === 'models' ? 'Modeli' : 'Klubovi'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Ukupno</p>
            <p className="text-2xl font-bold text-gray-900">{mediaItems.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 mb-1">Objavljeno</p>
            <p className="text-2xl font-bold text-green-900">
              {mediaItems.filter(m => m.is_approved === true).length}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 mb-1">Neodobreno</p>
            <p className="text-2xl font-bold text-red-900">
              {mediaItems.filter(m => m.is_approved !== true).length}
            </p>
          </div>
        </div>

        {/* Media Grid */}
        {mediaItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">Nema medija sa izabranim filterima</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mediaItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedMedia(item)}
              >
                {/* Media Preview */}
                <div className="aspect-square bg-gray-100 relative">
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
                      <p className="text-gray-500 text-xs">Loading...</p>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {item.is_approved === true ? (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                        ✓
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                        ✗
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-2">
                  <div className="flex items-center gap-1 mb-1">
                    {item.owner_type === 'model' ? (
                      <User className="w-3 h-3 text-pink-600" />
                    ) : (
                      <Building2 className="w-3 h-3 text-blue-600" />
                    )}
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.owner_name}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(item.uploaded_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full view modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-900" />
          </button>

          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Media */}
            <div className="bg-black rounded-lg overflow-hidden mb-4">
              {selectedMedia.type === 'photo' ? (
                <img
                  src={mediaUrls.get(selectedMedia.id)}
                  alt={selectedMedia.file_name}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <video
                  src={mediaUrls.get(selectedMedia.id)}
                  className="w-full max-h-[70vh] object-contain"
                  controls
                  autoPlay
                />
              )}
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                {selectedMedia.owner_type === 'model' ? (
                  <User className="w-5 h-5 text-pink-600" />
                ) : (
                  <Building2 className="w-5 h-5 text-blue-600" />
                )}
                <p className="font-semibold text-gray-900">{selectedMedia.owner_name}</p>
              </div>
              <p className="text-sm text-gray-600">{selectedMedia.owner_email}</p>
              <p className="text-sm text-gray-500 mt-2">
                Uploadovano: {new Date(selectedMedia.uploaded_at).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Status: {selectedMedia.is_approved ? 
                  <span className="text-green-600 font-semibold">Objavljeno na sajtu</span> : 
                  <span className="text-red-600 font-semibold">Nije objavljeno</span>
                }
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleToggleApproval(selectedMedia)}
                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                  selectedMedia.is_approved
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {selectedMedia.is_approved ? 'Ukloni sa sajta' : 'Objavi na sajt'}
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
