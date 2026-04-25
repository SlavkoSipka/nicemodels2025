'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  MapPin, Calendar, Phone, Mail, Globe,
  Building2, ArrowLeft, Pencil, Briefcase, MessageSquare,
} from 'lucide-react'
import Footer from '@/components/layout/Footer'
import { htmlToPlainText } from '@/lib/plainText'
import {
  listingTelHref,
  listingSmsHref,
  listingWhatsAppHref,
  listingViberHref,
  listingTelegramHref,
  listingPhoneDigits,
} from '@/lib/listingContactLinks'
import { trackListingView, trackListingClick } from '@/lib/tracking'

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
  has_sms: boolean
  email: string | null
  website: string | null
  created_at: string
  club_id: string
  club_name: string
  club_area: string | null
  photos: string[]
  services: { id: string; name: string }[]
  rent_price_daily: number | null
  rent_price_weekly: number | null
  rent_price_monthly: number | null
  rent_work_permit: boolean
  rent_room_size: string | null
  rent_furnished: boolean
  rent_kitchen: boolean
  rent_bathroom: boolean
  rent_air_conditioning: boolean
  rent_towels: boolean
}

export default function ListingDetailClient({ listing }: { listing: ListingDetail }) {
  const [isOwner, setIsOwner] = useState(false)

  const isJob = listing.listing_type === 'job'
  const displayTitle = listing.title || (isJob ? 'Job Listing' : 'Rent Listing')
  const cc = listing.country_code || '+41'
  const phone = listing.phone_number
  const phoneDigitsOk = phone ? listingPhoneDigits(cc, phone).length >= 8 : false
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

  useEffect(() => {
    const t = setTimeout(() => trackListingView(listing.id), 800)
    return () => clearTimeout(t)
  }, [listing.id])

  return (
    <>
      <div className="min-h-screen" style={{ background: '#fce9f3' }}>
        <div className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-8">

          {/* Back link */}
          <Link
            href="/jobs-rents"
            className="inline-flex items-center gap-1.5 text-sm font-semibold mb-4 sm:mb-6 transition-colors hover:text-pink-600"
            style={{ color: '#64748b' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to listings
          </Link>

          {/* ── Photos (top) ────────────────────────── */}
          {listing.photos.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {listing.photos.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-xl overflow-hidden transition-opacity hover:opacity-80"
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}
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

          {/* Main card */}
          <div
            className="overflow-hidden"
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid rgba(59,130,246,0.25)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}
          >
            {/* Blue top accent */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #1D4ED8, #3B82F6, #93C5FD)' }} />

            <div className="p-4 sm:p-8 space-y-5 sm:space-y-7">

              {/* ── Header ─────────────────────────────── */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Type badge */}
                  <span
                    className="inline-block px-3 py-1 text-[10px] font-bold rounded-full mb-4 uppercase tracking-widest"
                    style={{
                      background: isJob ? 'rgba(124,58,237,0.10)' : 'rgba(245,158,11,0.10)',
                      color: isJob ? '#7c3aed' : '#d97706',
                      border: `1px solid ${isJob ? 'rgba(124,58,237,0.25)' : 'rgba(245,158,11,0.25)'}`,
                    }}
                  >
                    {isJob ? 'Job Opportunity' : 'Rental Offer'}
                  </span>

                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-4" style={{ color: '#0f172a' }}>
                    {displayTitle}
                  </h1>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <Link
                      href={`/clubs/${listing.club_id}`}
                      className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-blue-600"
                      style={{ color: '#475569' }}
                    >
                      <Building2 className="w-4 h-4 shrink-0" style={{ color: '#3B82F6' }} />
                      {listing.club_name}
                    </Link>
                    <span style={{ color: '#cbd5e1' }}>·</span>
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: '#64748b' }}>
                      <MapPin className="w-4 h-4 shrink-0" style={{ color: '#EC4899' }} />
                      {listing.location}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>·</span>
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: '#94a3b8' }}>
                      <Calendar className="w-4 h-4 shrink-0" />
                      {dateStr}
                    </span>
                  </div>
                </div>

                {isOwner && (
                  <Link
                    href={`/dashboard/company/jobs-rent/edit/${listing.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.25)' }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                )}
              </div>

              {/* ── Description ────────────────────────── */}
              <div style={{ borderTop: '1px solid #f1f5f9' }} className="pt-6">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: '#94a3b8' }}>
                  Description
                </p>
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap" style={{ color: '#475569' }}>
                  {htmlToPlainText(listing.description)}
                </p>
              </div>

              {/* ── Rent Details ──────────────────────── */}
              {listing.listing_type === 'rent' && (
                <div style={{ borderTop: '1px solid #f1f5f9' }} className="pt-6 space-y-5">
                  {/* Pricing */}
                  {(listing.rent_price_daily || listing.rent_price_weekly || listing.rent_price_monthly) && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>
                        Pricing
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {listing.rent_price_daily != null && (
                          <div className="rounded-xl p-4 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <p className="text-xl font-bold" style={{ color: '#0f172a' }}>CHF {listing.rent_price_daily}</p>
                            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>per day</p>
                          </div>
                        )}
                        {listing.rent_price_weekly != null && (
                          <div className="rounded-xl p-4 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <p className="text-xl font-bold" style={{ color: '#0f172a' }}>CHF {listing.rent_price_weekly}</p>
                            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>per week</p>
                          </div>
                        )}
                        {listing.rent_price_monthly != null && (
                          <div className="rounded-xl p-4 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <p className="text-xl font-bold" style={{ color: '#0f172a' }}>CHF {listing.rent_price_monthly}</p>
                            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>per month</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Room details & amenities */}
                  {(listing.rent_room_size || listing.rent_work_permit || listing.rent_furnished || listing.rent_kitchen || listing.rent_bathroom || listing.rent_air_conditioning || listing.rent_towels) && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>
                        Room Details & Amenities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {listing.rent_room_size && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', color: '#1D4ED8', border: '1px solid rgba(59,130,246,0.20)' }}>
                            Size: {listing.rent_room_size}
                          </span>
                        )}
                        {listing.rent_work_permit && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', color: '#047857', border: '1px solid rgba(16,185,129,0.20)' }}>
                            Work Permit Allowed
                          </span>
                        )}
                        {listing.rent_furnished && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}>
                            Furnished
                          </span>
                        )}
                        {listing.rent_kitchen && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}>
                            Kitchen
                          </span>
                        )}
                        {listing.rent_bathroom && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}>
                            Shower + WC
                          </span>
                        )}
                        {listing.rent_air_conditioning && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}>
                            Air Conditioning
                          </span>
                        )}
                        {listing.rent_towels && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}>
                            Towels
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Services ───────────────────────────── */}
              {listing.services.length > 0 && (
                <div style={{ borderTop: '1px solid #f1f5f9' }} className="pt-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: '#94a3b8' }}>
                    Services
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {listing.services.map(s => (
                      <span
                        key={s.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{
                          background: 'rgba(236,72,153,0.08)',
                          color: '#BE185D',
                          border: '1px solid rgba(236,72,153,0.20)',
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
                <div style={{ borderTop: '1px solid #f1f5f9' }} className="pt-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>
                    Contact
                  </p>
                  <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
                    Reach out via phone, SMS, email, or the apps you prefer.
                  </p>
                  <div
                    className="rounded-xl p-5 space-y-4"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    {listing.phone_number && (
                      <>
                        <div className="flex items-start gap-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}
                          >
                            <Phone className="w-4 h-4" style={{ color: '#3B82F6' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>Phone</p>
                            <a
                              href={phoneDigitsOk ? listingTelHref(cc, phone!) : '#'}
                              onClick={() => phoneDigitsOk && trackListingClick(listing.id, 'phone')}
                              className="text-sm font-semibold transition-opacity hover:opacity-70 break-all"
                              style={{ color: '#0f172a' }}
                            >
                              {cc} {listing.phone_number}
                            </a>
                            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Tap to call</p>
                          </div>
                        </div>

                        {listing.has_sms && phoneDigitsOk && (
                          <div className="flex items-start gap-4">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}
                            >
                              <MessageSquare className="w-4 h-4" style={{ color: '#059669' }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>SMS</p>
                              <a
                                href={listingSmsHref(cc, phone!)}
                                onClick={() => trackListingClick(listing.id, 'sms')}
                                className="text-sm font-semibold text-emerald-700 hover:underline"
                              >
                                Send SMS
                              </a>
                            </div>
                          </div>
                        )}

                        {(listing.has_whatsapp || listing.has_viber || listing.has_telegram) && phoneDigitsOk && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Messaging</p>
                            <div className="flex flex-wrap gap-2">
                              {listing.has_whatsapp && (
                                <a
                                  href={listingWhatsAppHref(cc, phone!)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => trackListingClick(listing.id, 'whatsapp')}
                                  className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#25D366] hover:opacity-90 transition-opacity"
                                >
                                  WhatsApp
                                </a>
                              )}
                              {listing.has_viber && (
                                <a
                                  href={listingViberHref(cc, phone!)}
                                  onClick={() => trackListingClick(listing.id, 'viber')}
                                  className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#7360f2] hover:opacity-90 transition-opacity"
                                >
                                  Viber
                                </a>
                              )}
                              {listing.has_telegram && (
                                <a
                                  href={listingTelegramHref(cc, phone!)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => trackListingClick(listing.id, 'telegram')}
                                  className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#26A5E4] hover:opacity-90 transition-opacity"
                                >
                                  Telegram
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {listing.email && (
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}
                        >
                          <Mail className="w-4 h-4" style={{ color: '#3B82F6' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>Email</p>
                          <a
                            href={`mailto:${listing.email}`}
                            onClick={() => trackListingClick(listing.id, 'email')}
                            className="text-sm font-semibold transition-opacity hover:opacity-70 break-all"
                            style={{ color: '#334155' }}
                          >
                            {listing.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {listing.website && (
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}
                        >
                          <Globe className="w-4 h-4" style={{ color: '#3B82F6' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>Website</p>
                          <a
                            href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackListingClick(listing.id, 'website')}
                            className="text-sm font-semibold transition-opacity hover:opacity-70 break-all"
                            style={{ color: '#334155' }}
                          >
                            {listing.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Club link ──────────────────────────── */}
              <div style={{ borderTop: '1px solid #f1f5f9' }} className="pt-6">
                <Link
                  href={`/clubs/${listing.club_id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(59,130,246,0.07)',
                    color: '#3B82F6',
                    border: '1px solid rgba(59,130,246,0.22)',
                  }}
                >
                  <Briefcase className="w-4 h-4" />
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
