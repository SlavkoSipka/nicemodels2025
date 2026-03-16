'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Briefcase, MapPin, Phone, Mail, Globe, Building2 } from 'lucide-react'

export interface ListingBannerData {
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
  photoUrl: string | null
  club_name: string
}

interface ListingBannerCardProps {
  listing: ListingBannerData
}

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

export default function ListingBannerCard({ listing }: ListingBannerCardProps) {
  const isJob = listing.listing_type === 'job'
  const title = listing.title || (isJob ? 'Job Listing' : 'Rent Listing')
  const description = listing.description?.replace(/<[^>]*>/g, '') || ''
  const shortDesc = description.length > 160 ? description.slice(0, 160).trimEnd() + '…' : description
  const dateStr = new Date(listing.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <article
      className="overflow-hidden flex flex-col sm:flex-row w-full col-span-1 sm:col-span-2 transition-all duration-200"
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
        className="relative flex-shrink-0 overflow-hidden block"
        style={{ width: '100%', maxWidth: 180, minWidth: 130, aspectRatio: '3/4', background: '#e8f4f8' }}
      >
        {/* Blue left accent line */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: 'linear-gradient(to bottom, #1D4ED8, #3B82F6, #93C5FD)',
          zIndex: 2,
        }} />

        {listing.photoUrl ? (
          <Image
            src={listing.photoUrl}
            alt={title}
            fill
            quality={80}
            placeholder="blur"
            blurDataURL={BLUR}
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, 180px"
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

        {/* Date badge */}
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

        <div className="px-5 py-4 flex flex-col gap-3 flex-1">

          {/* Type label */}
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3B82F6' }}>
            {isJob ? 'Job Opportunity' : 'Rental Offer'}
          </span>

          {/* Title */}
          <Link href={`/jobs-rents/${listing.id}`}>
            <h3 className="font-bold text-base sm:text-lg leading-snug hover:text-blue-600 transition-colors"
              style={{ color: '#0f172a' }}>
              {title}
            </h3>
          </Link>

          {/* Club + Location */}
          <div className="flex flex-wrap items-center gap-3">
            {listing.club_name && (
              <Link
                href={`/clubs/${listing.club_id}`}
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-blue-600"
                style={{ color: '#475569' }}
                onClick={e => e.stopPropagation()}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#3B82F6' }} />
                {listing.club_name}
              </Link>
            )}
            {listing.club_name && listing.location && (
              <span style={{ color: '#cbd5e1' }}>·</span>
            )}
            {listing.location && (
              <span className="flex items-center gap-1.5 text-sm" style={{ color: '#64748b' }}>
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#EC4899' }} />
                {listing.location}
              </span>
            )}
          </div>

          {/* Description */}
          {shortDesc && (
            <p className="text-sm leading-relaxed flex-1" style={{ color: '#64748b' }}>
              {shortDesc}
            </p>
          )}

          {/* Contact row */}
          {(listing.phone_number || listing.email || listing.website) && (
            <div
              className="flex flex-wrap items-center gap-4 pt-3 mt-auto"
              style={{ borderTop: '1px solid #e2e8f0' }}
            >
              {listing.phone_number && (
                <a
                  href={`tel:${listing.country_code}${listing.phone_number}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
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
                  className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
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
                  className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                  style={{ color: '#64748b' }}
                >
                  <Globe className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />
                  Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
