'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Briefcase, MapPin, Calendar, Phone, Mail, Globe,
  Building2
} from 'lucide-react'
import Footer from '@/components/layout/Footer'

interface ListingData {
  id: string
  listing_type: 'job' | 'rent'
  title: string | null
  location: string
  description: string
  country_code: string | null
  phone_number: string | null
  has_whatsapp: boolean
  has_viber: boolean
  has_telegram: boolean
  email: string | null
  website: string | null
  created_at: string
  club_id: string
  club_name: string
  club_area: string | null
  photos: string[]
  services: { id: string; name: string }[]
}

type FilterType = 'all' | 'job' | 'rent'

export default function JobsRentsPageClient({ listings: initialListings }: { listings: ListingData[] }) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [listings, setListings] = useState<ListingData[]>(initialListings)

  useEffect(() => {
    const shuffled = [...initialListings]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setListings(shuffled)
  }, [])

  const filtered = filter === 'all' ? listings : listings.filter(l => l.listing_type === filter)
  const jobCount = listings.filter(l => l.listing_type === 'job').length
  const rentCount = listings.filter(l => l.listing_type === 'rent').length

  return (
    <>
      <div className="min-h-screen" style={{ background: '#fce9f3' }}>
        <div className="max-w-7xl mx-auto px-2 py-5 sm:px-4 sm:py-10">

          {/* Header */}
          <div className="mb-5 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">Jobs & Rent</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Browse job opportunities and rental listings</p>
          </div>

          {/* Stats + filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-semibold text-slate-900">{listings.length}</span>
              <span className="text-xs sm:text-sm text-slate-500">{listings.length === 1 ? 'listing' : 'listings'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 sm:ml-auto">
              {[
                { val: 'all' as FilterType, label: 'All', count: listings.length },
                { val: 'job' as FilterType, label: 'Jobs', count: jobCount },
                { val: 'rent' as FilterType, label: 'Rent', count: rentCount },
              ].map(({ val, label, count }) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                    filter === val
                      ? 'bg-[#ec4899] text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {label}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Listings */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">No listings yet</p>
              <p className="text-sm text-gray-500 mt-1">Check back soon for new opportunities.</p>
            </div>
          ) : (
            <ul className="space-y-3 sm:space-y-4">
              {filtered.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </ul>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

function ListingCard({ listing }: { listing: ListingData }) {
  const hasPhotos = listing.photos.length > 0
  const isJob = listing.listing_type === 'job'
  const title = listing.title || (isJob ? 'Job Listing' : 'Rent Listing')
  const description = listing.description.replace(/<[^>]*>/g, '')
  const shortDesc = description.length > 200 ? description.slice(0, 200).trimEnd() + '…' : description
  const dateStr = new Date(listing.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <li>
      <article
        className="overflow-hidden flex flex-col sm:flex-row w-full transition-all duration-200 cursor-pointer"
        style={{
          background: '#ffffff',
          borderRadius: 10,
          border: '1px solid rgba(59,130,246,0.25)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-3px)'
          el.style.boxShadow = '0 8px 32px rgba(59,130,246,0.20), 0 0 0 1px rgba(59,130,246,0.4)'
          el.style.borderColor = 'rgba(59,130,246,0.5)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
          el.style.borderColor = 'rgba(59,130,246,0.25)'
        }}
      >
        {/* Photo */}
        <Link
          href={`/jobs-rents/${listing.id}`}
          className="relative flex-shrink-0 overflow-hidden block w-full max-w-none min-h-[180px] sm:min-w-[140px] sm:w-auto sm:max-w-[200px]"
          style={{ aspectRatio: '3/4', background: '#e8f4f8' }}
        >
          {/* Blue left accent line */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
            background: 'linear-gradient(to bottom, #1D4ED8, #3B82F6, #93C5FD)',
            zIndex: 2,
          }} />

          {hasPhotos ? (
            <Image
              src={listing.photos[0]}
              alt={title}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 100vw, 200px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Briefcase className="w-12 h-12" style={{ color: 'rgba(0,0,0,0.15)' }} />
            </div>
          )}

          {/* Type badge */}
          <span
            className="absolute top-2.5 right-2.5 px-2.5 py-1 text-[10px] font-bold rounded-full z-10 tracking-wide uppercase"
            style={{
              background: isJob ? 'rgba(124,58,237,0.85)' : 'rgba(245,158,11,0.85)',
              color: '#fff',
              backdropFilter: 'blur(4px)',
            }}
          >
            {isJob ? 'Job' : 'Rent'}
          </span>

          {/* Date badge bottom */}
          <span
            className="absolute bottom-2.5 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full z-10"
            style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.75)' }}
          >
            {dateStr}
          </span>
        </Link>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Blue top strip */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #1D4ED8, #3B82F6, #93C5FD)', flexShrink: 0 }} />

          <div className="px-3 py-3 sm:px-5 sm:py-4 flex flex-col gap-2 sm:gap-3 flex-1 min-w-0">

            {/* Type label */}
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3B82F6' }}>
              {isJob ? 'Job Opportunity' : 'Rental Offer'}
            </span>

            {/* Title */}
            <Link href={`/jobs-rents/${listing.id}`}>
              <h3 className="font-bold text-sm sm:text-lg leading-snug hover:text-blue-600 transition-colors"
                style={{ color: '#0f172a' }}>
                {title}
              </h3>
            </Link>

            {/* Club + Location */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href={`/clubs/${listing.club_id}`}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors hover:text-blue-600 min-w-0"
                style={{ color: '#475569' }}
                onClick={e => e.stopPropagation()}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#3B82F6' }} />
                {listing.club_name}
              </Link>
              <span style={{ color: '#cbd5e1' }}>·</span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0" style={{ color: '#64748b' }}>
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#EC4899' }} />
                {listing.location}
              </span>
            </div>

            {/* Description */}
            {shortDesc && (
              <p className="text-xs sm:text-sm leading-relaxed flex-1" style={{ color: '#64748b' }}>
                {shortDesc}
              </p>
            )}

            {/* Services */}
            {listing.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {listing.services.slice(0, 6).map(s => (
                  <span
                    key={s.id}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(236,72,153,0.10)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}
                  >
                    {s.name}
                  </span>
                ))}
                {listing.services.length > 6 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(0,0,0,0.05)', color: '#94a3b8' }}>
                    +{listing.services.length - 6}
                  </span>
                )}
              </div>
            )}

            {/* Contact row */}
            <div
              className="flex flex-wrap items-center gap-2 sm:gap-4 pt-2 sm:pt-3 mt-auto"
              style={{ borderTop: '1px solid #e2e8f0' }}
            >
              {listing.phone_number && (
                <a
                  href={`tel:${listing.country_code}${listing.phone_number}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-opacity hover:opacity-70 break-all"
                  style={{ color: '#334155' }}
                >
                  <Phone className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />
                  {listing.country_code} {listing.phone_number}
                  {(listing.has_whatsapp || listing.has_viber || listing.has_telegram) && (
                    <span className="text-[10px] font-medium ml-1" style={{ color: '#94a3b8' }}>
                      {[listing.has_whatsapp && 'WA', listing.has_viber && 'Viber', listing.has_telegram && 'TG'].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </a>
              )}
              {listing.email && (
                <a
                  href={`mailto:${listing.email}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-opacity hover:opacity-70 break-all min-w-0"
                  style={{ color: '#64748b' }}
                >
                  <Mail className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />
                  {listing.email}
                </a>
              )}
              {listing.website && (
                <a
                  href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-opacity hover:opacity-70"
                  style={{ color: '#64748b' }}
                >
                  <Globe className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </article>
    </li>
  )
}
