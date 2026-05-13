'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('admin.jobsRents')
  const tc = useTranslations('admin.common')
  const tSb = useTranslations('admin.sidebar')
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
    if (!confirm(blocked ? t('confirmUnblock') : t('confirmBlock'))) return
    const res = await fetch('/api/admin/block-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, block: !blocked }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || tc('failedToUpdate'))
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
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{tSb('jobsRents')}</h1>
                <p className="text-xs text-gray-500">{t('totalListings', { count: listings.length })}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'job', 'rent'] as const).map(kind => (
                <button
                  key={kind}
                  onClick={() => setTypeFilter(kind)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    typeFilter === kind ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {kind === 'all' ? t('filterAll') : kind === 'job' ? t('filterJobs') : t('filterRents')}
                  <span className="ml-1 opacity-60">{counts[kind]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-2.5">
            {filtered.map(listing => (
              <div key={listing.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  {listing.photoUrl ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                      <Image src={listing.photoUrl} alt={listing.title || t('colListing')} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate flex-1">
                        {listing.title || <span className="text-gray-400 font-normal italic">{t('noTitle')}</span>}
                      </p>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                        listing.listing_type === 'job' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {listing.listing_type === 'job' ? t('typeJob') : t('typeRent')}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3 text-gray-400" />{listing.clubName}</span>
                      {listing.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{listing.location}</span>}
                      <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusColors[listing.status] || 'bg-gray-100 text-gray-500'}`}>
                        {listing.status === 'active' ? t('statusActive') : listing.status === 'expired' ? t('statusExpired') : listing.status === 'deleted' ? t('statusDeleted') : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </span>
                      {listing.is_blocked && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700">
                          <Ban className="w-2.5 h-2.5" /> {tc('blocked')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2">
                  <Link href={`/dashboard/admin/jobs-rents/${listing.id}`}
                    className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 inline-flex items-center justify-center gap-1">
                    <Pencil className="w-3 h-3" /> {tc('edit')}
                  </Link>
                  <Link href={`/jobs-rents/${listing.id}`} target="_blank"
                    className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 inline-flex items-center justify-center">
                    {t('viewListing')}
                  </Link>
                  <button onClick={() => handleBlock(listing.id, listing.is_blocked)}
                    className={`flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-md ${
                      listing.is_blocked ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {listing.is_blocked ? tc('unblock') : tc('block')}
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg text-center py-8">
                <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t('noListingsFound')}</p>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {[t('colListing'), t('colClub'), t('colLocation'), t('colType'), tc('status'), tc('date'), tc('actions')].map(h => (
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
                              <Image src={listing.photoUrl} alt={listing.title || t('colListing')} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <Briefcase className="w-4 h-4 text-purple-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                              {listing.title || <span className="text-gray-400 font-normal italic">{t('noTitle')}</span>}
                            </p>
                            <Link href={`/jobs-rents/${listing.id}`} target="_blank" className="text-xs text-purple-500 hover:underline">
                              {t('viewListing')}
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
                          {listing.listing_type === 'job' ? t('typeJob') : t('typeRent')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[listing.status] || 'bg-gray-100 text-gray-500'}`}>
                            {listing.status === 'active' ? t('statusActive') : listing.status === 'expired' ? t('statusExpired') : listing.status === 'deleted' ? t('statusDeleted') : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                          </span>
                          {listing.is_blocked && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <Ban className="w-3 h-3" /> {tc('blocked')}
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
                            <Pencil className="w-3 h-3" /> {tc('edit')}
                          </Link>
                          <button
                            onClick={() => handleBlock(listing.id, listing.is_blocked)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                              listing.is_blocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {listing.is_blocked ? tc('unblock') : tc('block')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="hidden md:block text-center py-12">
                <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t('noListingsFound')}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
