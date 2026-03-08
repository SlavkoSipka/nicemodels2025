'use client'

import { useState } from 'react'
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

export default function JobsRentsPageClient({ listings }: { listings: ListingData[] }) {
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all' ? listings : listings.filter(l => l.listing_type === filter)
  const jobCount = listings.filter(l => l.listing_type === 'job').length
  const rentCount = listings.filter(l => l.listing_type === 'rent').length

  return (
    <>
      <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 370px, #1f2126 370px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white tracking-tight">Jobs & Rent</h1>
            <p className="text-sm text-white/70 mt-1">Browse job opportunities and rental listings</p>
          </div>

          {/* Stats + filter */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-white/15">
            <span className="text-2xl font-semibold text-white">{listings.length}</span>
            <span className="text-sm text-white/60">{listings.length === 1 ? 'listing' : 'listings'}</span>
            <div className="ml-auto flex gap-2">
              {[
                { val: 'all' as FilterType, label: 'All', count: listings.length },
                { val: 'job' as FilterType, label: 'Jobs', count: jobCount },
                { val: 'rent' as FilterType, label: 'Rent', count: rentCount },
              ].map(({ val, label, count }) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    filter === val
                      ? 'bg-white text-gray-900'
                      : 'bg-white/15 text-white/80 hover:bg-white/25'
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
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">No listings yet</p>
              <p className="text-sm text-gray-500 mt-1">Check back soon for new opportunities.</p>
            </div>
          ) : (
            <ul className="space-y-4">
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

  return (
    <li>
      <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
        <Link href={`/jobs-rents/${listing.id}`} className="flex flex-col sm:flex-row">

          {/* Photo — first image only */}
          <div className="relative w-full sm:w-56 flex-shrink-0 aspect-[3/4] bg-gray-100 block">
            {hasPhotos ? (
              <Image
                src={listing.photos[0]}
                alt={`${listing.listing_type} in ${listing.location}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 224px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Briefcase className="w-12 h-12 text-gray-300" />
              </div>
            )}
            {/* Type badge */}
            <span className={`absolute top-2 left-2 px-2.5 py-1 text-xs font-bold rounded-full ${
              listing.listing_type === 'job'
                ? 'bg-violet-600 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {listing.listing_type === 'job' ? 'Job' : 'Rent'}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 sm:p-7 min-w-0 flex flex-col justify-between gap-4">

            {/* Top - title + club + location */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/jobs-rents/${listing.id}`}
                    className="text-lg sm:text-xl font-bold text-gray-900 hover:text-brand transition-colors"
                  >
                    {listing.title || (listing.listing_type === 'job' ? 'Job Listing' : 'Rent Listing')}
                  </Link>
                  <div className="flex items-center gap-3 mt-1">
                    <Link
                      href={`/clubs/${listing.club_id}`}
                      className="text-sm font-semibold text-gray-600 hover:text-brand transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5 inline mr-1" />
                      {listing.club_name}
                    </Link>
                    <p className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {listing.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex-1">
              <div className="text-sm sm:text-base text-gray-700 leading-relaxed line-clamp-4 rich-text-content" dangerouslySetInnerHTML={{ __html: listing.description }} />
            </div>

            {/* Services */}
            {listing.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {listing.services.slice(0, 6).map(s => (
                  <span
                    key={s.id}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand/10 text-brand border border-brand/20"
                  >
                    {s.name}
                  </span>
                ))}
                {listing.services.length > 6 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                    +{listing.services.length - 6} more
                  </span>
                )}
              </div>
            )}

            {/* Bottom - contact + date */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
              <div className="flex items-center gap-3 flex-wrap">
                {listing.phone_number && (
                  <a
                    href={`tel:${listing.country_code}${listing.phone_number}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 font-semibold text-gray-700 hover:text-brand transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {listing.country_code} {listing.phone_number}
                  </a>
                )}
                {listing.has_whatsapp && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 font-semibold rounded-full">WhatsApp</span>}
                {listing.has_viber && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 font-semibold rounded-full">Viber</span>}
                {listing.has_telegram && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 font-semibold rounded-full">Telegram</span>}
                {listing.email && (
                  <a href={`mailto:${listing.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 hover:text-brand transition-colors">
                    <Mail className="w-4 h-4" /> {listing.email}
                  </a>
                )}
                {listing.website && (
                  <a
                    href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-brand transition-colors"
                  >
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
              </div>

              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar className="w-4 h-4" />
                {new Date(listing.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </Link>
      </article>
    </li>
  )
}
