'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
  Briefcase, Plus, Trash2, MapPin, Calendar, AlertCircle, CheckCircle, Clock, Eye, Globe,
} from 'lucide-react'
import { formatRegions } from '@/lib/regions'

interface Listing {
  id: string
  listing_type: 'job' | 'rent'
  title: string | null
  location: string
  description: string
  status: string
  starts_at: string
  expires_at: string | null
  created_at: string
  regions: string[] | null
  photoUrl: string | null
}

export default function UserJobsRentPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.user.jobsRent')
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadListings = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error: fetchErr } = await supabase
      .from('job_listings')
      .select('id, listing_type, title, location, description, status, starts_at, expires_at, created_at, regions')
      .eq('club_id', user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })

    if (fetchErr) {
      if ((fetchErr as any).code === '42P01') {
        setLoading(false)
        return
      }
      setError(t('loadFailed', { error: fetchErr.message }))
      setLoading(false)
      return
    }

    const listingIds = (data || []).map(l => l.id)
    const photosMap = new Map<string, string>()

    if (listingIds.length > 0) {
      const { data: photos } = await supabase
        .from('job_listing_photos')
        .select('listing_id, file_path')
        .in('listing_id', listingIds)
        .order('display_order', { ascending: true })

      const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
      for (const p of photos ?? []) {
        if (!photosMap.has(p.listing_id) && p.file_path) {
          photosMap.set(p.listing_id, `${SUPA_URL}/storage/v1/object/public/job-listing-photos/${p.file_path}`)
        }
      }
    }

    setListings((data || []).map(l => ({
      ...l,
      photoUrl: photosMap.get(l.id) || null,
    })))
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return
    const supabase = createClient()
    const { error: delErr } = await supabase
      .from('job_listings')
      .update({ status: 'deleted' })
      .eq('id', id)
    if (delErr) {
      setError(t('deleteFailed'))
    } else {
      setListings(prev => prev.filter(l => l.id !== id))
      setSuccess(t('deleted'))
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const getStatusInfo = (listing: Listing) => {
    if (listing.status === 'expired') return { label: t('statusExpired'), cls: 'bg-gray-100 text-gray-600 border-gray-200' }
    if (listing.expires_at && new Date(listing.expires_at) < new Date()) return { label: t('statusExpired'), cls: 'bg-gray-100 text-gray-600 border-gray-200' }
    if (listing.starts_at && new Date(listing.starts_at) > new Date()) return { label: t('statusScheduled'), cls: 'bg-blue-50 text-blue-700 border-blue-200' }
    return { label: t('statusActive'), cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-0 md:ml-[280px]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-3 md:py-6 px-3 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-3 md:space-y-4">

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-brand" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-[11px] md:text-xs text-gray-500">{t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/user/jobs-rent/create')}
            className="flex items-center gap-1.5 px-3.5 md:px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
          >
            <Plus className="w-4 h-4" /> {t('create')}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">{success}</p>
          </div>
        )}

        {listings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 md:p-10 text-center">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600 mb-1">{t('noListings')}</p>
            <p className="text-xs text-gray-400 mb-4">{t('noListingsHint')}</p>
            <button
              onClick={() => router.push('/dashboard/user/jobs-rent/create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
            >
              <Plus className="w-4 h-4" /> {t('createListing')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(listing => {
              const status = getStatusInfo(listing)
              return (
                <div key={listing.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-40 aspect-[4/3] sm:aspect-auto bg-gray-100 shrink-0">
                      {listing.photoUrl ? (
                        <img src={listing.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Briefcase className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-3.5 md:p-4 min-w-0 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full border ${
                            listing.listing_type === 'job'
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {listing.listing_type === 'job' ? t('typeJob') : t('typeRent')}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${status.cls}`}>
                            {status.label}
                          </span>
                        </div>
                        {listing.title && (
                          <p className="text-sm font-bold text-gray-900 mb-0.5">{listing.title}</p>
                        )}
                        <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3" /> {listing.location}
                        </p>
                        {listing.regions && listing.regions.length > 0 && (
                          <p className="text-[11px] md:text-xs text-gray-500 flex items-center gap-1 mb-1">
                            <Globe className="w-3 h-3" /> {formatRegions(listing.regions)}
                          </p>
                        )}
                        <p className="text-xs md:text-sm text-gray-700 line-clamp-2">{listing.description?.replace(/<[^>]*>/g, '')}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-3 flex-wrap text-[11px] md:text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(listing.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {listing.expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {t('expiresLabel', { date: new Date(listing.expires_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => router.push(`/jobs-rents/${listing.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> {t('view')}
                          </button>
                          <button
                            onClick={() => handleDelete(listing.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
