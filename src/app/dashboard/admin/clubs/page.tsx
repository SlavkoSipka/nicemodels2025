'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Ban, CheckCircle, Search, Building2, Camera, Pencil, Trash2, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import PhotoGalleryModal from '@/components/admin/PhotoGalleryModal'
import { downloadCsv, fmtDateTime } from '@/lib/exportCsv'

interface Club {
  id: string
  email: string
  username: string
  public_id?: number | null
  created_at: string
  is_blocked: boolean
  onboarding_completed: boolean
  is_verified: boolean
  club_details?: { club_name: string; display_name: string; city: string }
  photoUrl?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  contact_website?: string | null
}

type SortKey = 'name' | 'email' | 'city' | 'created_at' | 'is_verified' | 'is_blocked'

export default function AdminClubsPage() {
  const [loading, setLoading] = useState(true)
  const [clubs, setClubs] = useState<Club[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => { loadClubs() }, [])

  const loadClubs = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select(`id, email, username, public_id, created_at, is_blocked, onboarding_completed, is_verified,
        club_details!club_details_club_id_fkey (club_name, display_name, city)`)
      .eq('role', 'company')
      .order('created_at', { ascending: false })

    if (error) { setLoading(false); return }

    const clubIds = (data || []).map((c: any) => c.id)
    const [{ data: photos }, { data: contacts }] = await Promise.all([
      supabase
        .from('club_photos')
        .select('club_id, file_path')
        .in('club_id', clubIds)
        .eq('is_approved', true)
        .order('uploaded_at', { ascending: false }),
      supabase
        .from('club_contact_details')
        .select('club_id, country_code, phone_number, email, website')
        .in('club_id', clubIds),
    ])

    const photoMap: Record<string, string> = {}
    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    for (const p of photos || []) {
      if (!photoMap[p.club_id] && p.file_path) {
        photoMap[p.club_id] = `${SUPA_URL}/storage/v1/object/public/club-photos/${p.file_path}`
      }
    }

    const contactMap: Record<string, { phone: string | null; email: string | null; website: string | null }> = {}
    for (const c of contacts || []) {
      const phone = c.phone_number ? `${c.country_code || ''} ${c.phone_number}`.trim() : null
      contactMap[c.club_id] = { phone, email: c.email || null, website: c.website || null }
    }

    setClubs((data || []).map((c: any) => ({
      ...c,
      club_details: Array.isArray(c.club_details) ? c.club_details[0] : c.club_details,
      photoUrl: photoMap[c.id] || null,
      contact_phone: contactMap[c.id]?.phone || null,
      contact_email: contactMap[c.id]?.email || null,
      contact_website: contactMap[c.id]?.website || null,
    })))
    setLoading(false)
  }

  const handleBlock = async (userId: string, blocked: boolean) => {
    if (!confirm(`${blocked ? 'Unblock' : 'Block'} this club?`)) return
    const res = await fetch('/api/admin/block-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, block: !blocked }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Failed to update block status')
      return
    }
    loadClubs()
  }

  const handleDelete = async (club: Club) => {
    const name = club.club_details?.club_name || club.club_details?.display_name || club.username || club.email
    const confirmation = prompt(`Type DELETE to permanently remove club "${name}".\nThis will delete the account, photos, listings, and all data. This cannot be undone.`)
    if (confirmation !== 'DELETE') return
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: club.id, reason: 'Deleted by admin' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      setClubs(prev => prev.filter(c => c.id !== club.id))
    } catch (e: any) {
      alert(e.message || 'Failed to delete club')
    }
  }

  const filtered = clubs.filter(c => {
    const q = searchTerm.toLowerCase()
    if (!q) return true
    if (c.public_id && (`#${c.public_id}` === q || String(c.public_id) === q)) return true
    return c.email.toLowerCase().includes(q) ||
      c.username?.toLowerCase().includes(q) ||
      c.club_details?.club_name?.toLowerCase().includes(q) ||
      c.club_details?.display_name?.toLowerCase().includes(q)
  })

  const sortValue = (c: Club, key: SortKey): string | number => {
    switch (key) {
      case 'name': return (c.club_details?.club_name || c.club_details?.display_name || c.username || '').toLowerCase()
      case 'email': return (c.email || '').toLowerCase()
      case 'city': return (c.club_details?.city || '').toLowerCase()
      case 'created_at': return new Date(c.created_at || 0).getTime()
      case 'is_verified': return c.is_verified ? 1 : 0
      case 'is_blocked': return c.is_blocked ? 1 : 0
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    const va = sortValue(a, sortKey)
    const vb = sortValue(b, sortKey)
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb)) * dir
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'created_at' ? 'desc' : 'asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 text-gray-300" />
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-gray-700" />
      : <ArrowDown className="w-3 h-3 text-gray-700" />
  }

  const handleDownloadCsv = () => {
    downloadCsv('nicemodels-clubs', sorted, [
      { header: 'Public ID', value: c => c.public_id ?? '' },
      { header: 'Club Name', value: c => c.club_details?.club_name || '' },
      { header: 'Display Name', value: c => c.club_details?.display_name || '' },
      { header: 'Username', value: c => c.username || '' },
      { header: 'Account Email', value: c => c.email || '' },
      { header: 'Contact Email', value: c => c.contact_email || '' },
      { header: 'Phone', value: c => c.contact_phone || '' },
      { header: 'Website', value: c => c.contact_website || '' },
      { header: 'City', value: c => c.club_details?.city || '' },
      { header: 'Joined', value: c => fmtDateTime(c.created_at) },
      { header: 'Verified', value: c => c.is_verified ? 'Yes' : 'No' },
      { header: 'Onboarded', value: c => c.onboarding_completed ? 'Yes' : 'No' },
      { header: 'Blocked', value: c => c.is_blocked ? 'Yes' : 'No' },
      { header: 'User ID', value: c => c.id },
    ])
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Clubs Management</h1>
                  <p className="text-xs text-gray-500">{clubs.length} total · {sorted.length} shown</p>
                </div>
              </div>
              <button
                onClick={handleDownloadCsv}
                disabled={sorted.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download visible rows as CSV (Excel)"
              >
                <Download className="w-4 h-4" />
                Download CSV ({sorted.length})
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by ID, email, username, or club name..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent" />
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {([
                      { label: 'Club', key: 'name' as SortKey },
                      { label: 'Email', key: 'email' as SortKey },
                      { label: 'City', key: 'city' as SortKey },
                      { label: 'Joined', key: 'created_at' as SortKey },
                      { label: 'Verified', key: 'is_verified' as SortKey },
                      { label: 'Status', key: 'is_blocked' as SortKey },
                    ]).map(col => (
                      <th key={col.key} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <button onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 hover:text-gray-900">
                          {col.label}
                          <SortIcon k={col.key} />
                        </button>
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map(club => (
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
                              {club.public_id && <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{club.public_id}</span>}
                            </p>
                            <p className="text-xs text-gray-400 truncate">@{club.username || 'no-username'}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate"><a href={`mailto:${club.email}`} className="hover:text-brand hover:underline">{club.email}</a></td>
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
                          <button
                            onClick={() => handleDelete(club)}
                            className="p-1.5 text-xs font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            title="Delete account permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sorted.length === 0 && (
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
