'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  MapPin, Calendar, Phone, Mail, Globe,
  Building2, ArrowLeft, Pencil
} from 'lucide-react'
import Footer from '@/components/layout/Footer'

interface ListingDetail {
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

const SECTION_LABEL = {
  color: 'rgba(255,255,255,0.28)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  marginBottom: 12,
}

const DIVIDER = { borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 0 }

export default function ListingDetailClient({ listing }: { listing: ListingDetail }) {
  const [isOwner, setIsOwner] = useState(false)

  const isJob = listing.listing_type === 'job'
  const displayTitle = listing.title || (isJob ? 'Job Listing' : 'Rent Listing')
  const dateStr = new Date(listing.created_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  useEffect(() => {
    const checkOwner = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === listing.club_id) setIsOwner(true)
    }
    checkOwner()
  }, [listing.club_id])

  return (
    <>
      <div className="min-h-screen" style={{ background: '#1f2126' }}>

        {/* Pink top banner */}
        <div style={{ background: '#BE185D', height: 220, position: 'relative' }}>
          <div className="max-w-5xl mx-auto px-4 pt-8">
            <Link
              href="/jobs-rents"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to listings
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-16" style={{ marginTop: -140 }}>

          {/* Main card */}
          <div
            className="overflow-hidden"
            style={{
              background: '#272a31',
              borderRadius: 14,
              border: '1px solid rgba(59,130,246,0.30)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
            }}
          >
            {/* Blue top accent */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #1D4ED8, #3B82F6, #93C5FD)' }} />

            <div className="p-6 sm:p-8 space-y-8">

              {/* ── Header ─────────────────────────────── */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Type badge */}
                  <span
                    className="inline-block px-3 py-1 text-[10px] font-bold rounded-full mb-4 uppercase tracking-widest"
                    style={{
                      background: isJob ? 'rgba(124,58,237,0.2)' : 'rgba(245,158,11,0.2)',
                      color: isJob ? '#a78bfa' : '#fcd34d',
                      border: `1px solid ${isJob ? 'rgba(124,58,237,0.35)' : 'rgba(245,158,11,0.35)'}`,
                    }}
                  >
                    {isJob ? 'Job Opportunity' : 'Rental Offer'}
                  </span>

                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-4"
                    style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {displayTitle}
                  </h1>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <Link
                      href={`/clubs/${listing.club_id}`}
                      className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
                      style={{ color: 'rgba(255,255,255,0.65)' }}
                    >
                      <Building2 className="w-4 h-4 shrink-0" style={{ color: '#3B82F6' }} />
                      {listing.club_name}
                    </Link>
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <MapPin className="w-4 h-4 shrink-0" style={{ color: '#EC4899' }} />
                      {listing.location}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <Calendar className="w-4 h-4 shrink-0" />
                      {dateStr}
                    </span>
                  </div>
                </div>

                {isOwner && (
                  <Link
                    href={`/dashboard/company/jobs-rent/edit/${listing.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)' }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                )}
              </div>

              {/* ── Description ────────────────────────── */}
              <div style={DIVIDER} className="pt-6">
                <p style={SECTION_LABEL}>Description</p>
                <div
                  className="text-sm sm:text-base leading-relaxed rich-text-content"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                  dangerouslySetInnerHTML={{ __html: listing.description }}
                />
              </div>

              {/* ── Services ───────────────────────────── */}
              {listing.services.length > 0 && (
                <div style={DIVIDER} className="pt-6">
                  <p style={SECTION_LABEL}>Services</p>
                  <div className="flex flex-wrap gap-2">
                    {listing.services.map(s => (
                      <span
                        key={s.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{
                          background: 'rgba(236,72,153,0.1)',
                          color: '#F472B6',
                          border: '1px solid rgba(236,72,153,0.2)',
                        }}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Contact ────────────────────────────── */}
              {(listing.phone_number || listing.email || listing.website) && (
                <div style={DIVIDER} className="pt-6">
                  <p style={SECTION_LABEL}>Contact</p>
                  <div
                    className="rounded-xl p-5 space-y-4"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    {listing.phone_number && (
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                        >
                          <Phone className="w-4 h-4" style={{ color: '#93C5FD' }} />
                        </div>
                        <div>
                          <a
                            href={`tel:${listing.country_code}${listing.phone_number}`}
                            className="text-sm font-semibold transition-opacity hover:opacity-70"
                            style={{ color: 'rgba(255,255,255,0.85)' }}
                          >
                            {listing.country_code} {listing.phone_number}
                          </a>
                          {(listing.has_whatsapp || listing.has_viber || listing.has_telegram) && (
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              Available on{' '}
                              {[
                                listing.has_whatsapp && 'WhatsApp',
                                listing.has_viber && 'Viber',
                                listing.has_telegram && 'Telegram',
                              ].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {listing.email && (
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                        >
                          <Mail className="w-4 h-4" style={{ color: '#93C5FD' }} />
                        </div>
                        <a
                          href={`mailto:${listing.email}`}
                          className="text-sm font-semibold transition-opacity hover:opacity-70"
                          style={{ color: 'rgba(255,255,255,0.75)' }}
                        >
                          {listing.email}
                        </a>
                      </div>
                    )}

                    {listing.website && (
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                        >
                          <Globe className="w-4 h-4" style={{ color: '#93C5FD' }} />
                        </div>
                        <a
                          href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold transition-opacity hover:opacity-70"
                          style={{ color: 'rgba(255,255,255,0.75)' }}
                        >
                          {listing.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Photos ─────────────────────────────── */}
              {listing.photos.length > 0 && (
                <div style={DIVIDER} className="pt-6">
                  <p style={SECTION_LABEL}>Photos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {listing.photos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square rounded-xl overflow-hidden transition-opacity hover:opacity-80"
                        style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <Image
                          src={url}
                          alt={`Photo ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Club link ──────────────────────────── */}
              <div style={DIVIDER} className="pt-6">
                <Link
                  href={`/clubs/${listing.club_id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    color: '#93C5FD',
                    border: '1px solid rgba(59,130,246,0.25)',
                  }}
                >
                  <Building2 className="w-4 h-4" />
                  View {listing.club_name}&apos;s profile
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
