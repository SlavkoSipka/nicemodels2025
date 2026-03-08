'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Ban, CheckCircle, Search, Building2, Camera, Pencil } from 'lucide-react'
import PhotoGalleryModal from '@/components/admin/PhotoGalleryModal'

interface Club {
  id: string
  email: string
  username: string
  created_at: string
  is_blocked: boolean
  onboarding_completed: boolean
  is_verified: boolean
  club_details?: { club_name: string; display_name: string; city: string }
  photoUrl?: string | null
}

export default function AdminClubsPage() {
  const [loading, setLoading] = useState(true)
  const [clubs, setClubs] = useState<Club[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  useEffect(() => { loadClubs() }, [])

  const loadClubs = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select(`id, email, username, created_at, is_blocked, onboarding_completed, is_verified,
        club_details!club_details_club_id_fkey (club_name, display_name, city)`)
      .eq('role', 'company')
      .order('created_at', { ascending: false })

    if (error) { setLoading(false); return }

    const clubIds = (data || []).map((c: any) => c.id)
    const { data: photos } = await supabase
      .from('club_photos')
      .select('club_id, file_path')
      .in('club_id', clubIds)
      .eq('is_approved', true)
      .order('uploaded_at', { ascending: false })

    const photoMap: Record<string, string> = {}
    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    for (const p of photos || []) {
      if (!photoMap[p.club_id] && p.file_path) {
        photoMap[p.club_id] = `${SUPA_URL}/storage/v1/object/public/club-photos/${p.file_path}`
      }
    }

    setClubs((data || []).map((c: any) => ({
      ...c,
      club_details: Array.isArray(c.club_details) ? c.club_details[0] : c.club_details,
      photoUrl: photoMap[c.id] || null,
    })))
    setLoading(false)
  }

  const handleBlock = async (userId: string, blocked: boolean) => {
    if (!confirm(`${blocked ? 'Unblock' : 'Block'} this club?`)) return
    const supabase = createClient()
    await supabase.from('profiles').update({
      is_blocked: !blocked,
      blocked_at: !blocked ? new Date().toISOString() : null,
    }).eq('id', userId)
    loadClubs()
  }

  const filtered = clubs.filter(c =>
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.club_details?.club_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.club_details?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Clubs Management</h1>
                <p className="text-xs text-gray-500">{clubs.length} total clubs</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by email, username, or club name..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent" />
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Club', 'Email', 'City', 'Joined', 'Verified', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(club => (
                    <tr key={club.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/admin/clubs/${club.id}`}
                          className="flex items-center gap-2.5 group">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden relative">
                            {club.photoUrl ? (
                              <Image src={club.photoUrl} alt={club.club_details?.display_name || club.username} fill sizes="32px" className="object-cover" />
                            ) : (
                              <Building2 className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand transition-colors">
                              {club.club_details?.club_name || club.club_details?.display_name || club.username || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">@{club.username || 'no-username'}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{club.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{club.club_details?.city || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(club.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {club.is_verified ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <CheckCircle className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {club.is_blocked ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <Ban className="w-3 h-3" /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          )}
                          {!club.onboarding_completed && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">Incomplete</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/dashboard/admin/clubs/${club.id}`}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-brand/10 text-brand hover:bg-brand/20 transition-colors flex items-center gap-1">
                            <Pencil className="w-3 h-3" /> Edit
                          </Link>
                          <button onClick={() => { setSelectedClub(club); setShowPhotoModal(true) }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Photos
                          </button>
                          <button onClick={() => handleBlock(club.id, club.is_blocked)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                              club.is_blocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}>
                            {club.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">No clubs found</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {selectedClub && (
        <PhotoGalleryModal isOpen={showPhotoModal}
          onClose={() => { setShowPhotoModal(false); setSelectedClub(null) }}
          profileId={selectedClub.id}
          profileName={selectedClub.club_details?.club_name || selectedClub.club_details?.display_name || selectedClub.username || 'Club'}
          profileType="club" />
      )}
    </div>
  )
}
