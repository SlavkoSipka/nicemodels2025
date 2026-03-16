'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Ban, Search, Briefcase, Pencil, MapPin, Building2 } from 'lucide-react'

interface Listing {
  id: string
  title: string | null
  location: string
  listing_type: 'job' | 'rent'
  status: string
  is_blocked: boolean
  created_at: string
  club_id: string
  clubName: string
  photoUrl: string | null
}

export default function AdminJobsRentsPage() {
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'job' | 'rent'>('all')

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  useEffect(() => { loadListings() }, [])

  const loadListings = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('job_listings')
      .select('id, title, location, listing_type, status, is_blocked, created_at, club_id')
      .order('created_at', { ascending: false })

    if (error) { setLoading(false); return }

    const clubIds = [...new Set((data || []).map((l: any) => l.club_id).filter(Boolean))]

    const [{ data: profiles }, { data: photos }] = await Promise.all([
      clubIds.length > 0
        ? supabase.from('profiles').select('id, username').in('id', clubIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from('job_listing_photos')
        .select('listing_id, file_path')
        .in('listing_id', (data || []).map((l: any) => l.id))
        .order('display_order', { ascending: true }),
    ])

    const profileMap: Record<string, string> = {}
    for (const p of profiles || []) {
      profileMap[p.id] = p.username
    }

    const photoMap: Record<string, string> = {}
    for (const p of photos || []) {
      if (!photoMap[p.listing_id] && p.file_path) {
        photoMap[p.listing_id] = `${SUPA_URL}/storage/v1/object/public/job-listing-photos/${p.file_path}`
      }
    }

    setListings((data || []).map((l: any) => ({
      ...l,
      clubName: profileMap[l.club_id] || 'N/A',
      photoUrl: photoMap[l.id] || null,
    })))
    setLoading(false)
  }

  const handleBlock = async (listingId: string, blocked: boolean) => {
    if (!confirm(`${blocked ? 'Unblock' : 'Block'} this listing?`)) return
    const res = await fetch('/api/admin/block-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, block: !blocked }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Failed to update block status')
      return
    }
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, is_blocked: !blocked } : l))
  }

  const filtered = listings.filter(l => {
    const matchType = typeFilter === 'all' || l.listing_type === typeFilter
    const q = searchTerm.toLowerCase()
    const matchSearch = !q ||
      l.title?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.clubName?.toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const counts = {
    all: listings.length,
    job: listings.filter(l => l.listing_type === 'job').length,
    rent: listings.filter(l => l.listing_type === 'rent').length,
  }

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    expired: 'bg-amber-50 text-amber-700',
    deleted: 'bg-gray-100 text-gray-500',
  }

  if (loading) return null

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
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Jobs & Rents Management</h1>
                <p className="text-xs text-gray-500">{listings.length} total listings</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, location, or club..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'job', 'rent'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    typeFilter === t ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'job' ? 'Jobs' : 'Rents'}
                  <span className="ml-1 opacity-60">{counts[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Listing', 'Club', 'Location', 'Type', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(listing => (
                    <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">

                      {/* Listing */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {listing.photoUrl ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                              <Image src={listing.photoUrl} alt={listing.title || 'Listing'} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <Briefcase className="w-4 h-4 text-purple-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                              {listing.title || <span className="text-gray-400 font-normal italic">No title</span>}
                            </p>
                            <Link href={`/jobs-rents/${listing.id}`} target="_blank" className="text-xs text-purple-500 hover:underline">
                              View listing ↗
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Club */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{listing.clubName}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[100px]">{listing.location || '—'}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          listing.listing_type === 'job' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {listing.listing_type === 'job' ? 'Job' : 'Rent'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[listing.status] || 'bg-gray-100 text-gray-500'}`}>
                            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                          </span>
                          {listing.is_blocked && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <Ban className="w-3 h-3" /> Blocked
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/dashboard/admin/jobs-rents/${listing.id}`}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors bg-purple-50 text-purple-700 hover:bg-purple-100 inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </Link>
                          <button
                            onClick={() => handleBlock(listing.id, listing.is_blocked)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                              listing.is_blocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {listing.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No listings found</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
