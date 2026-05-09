'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
  expires_at: string | null
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
  const t = useTranslations('publicPages.listingDetail')
  const [isOwner, setIsOwner] = useState(false)

  const isJob = listing.listing_type === 'job'
  const displayTitle = listing.title || (isJob ? t('fallbackJobTitle') : t('fallbackRentTitle'))
  const cc = listing.country_code || '+41'
  const phone = listing.phone_number
  const phoneDigitsOk = phone ? listingPhoneDigits(cc, phone).length >= 8 : false
  const dateStr = new Date(listing.created_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const isExpired = listing.expires_at ? new Date(listing.expires_at) < new Date() : false
  const expiredDateStr = listing.expires_at
    ? new Date(listing.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  useEffect(() => {
    const checkOwner = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.id === listing.club_id) setIsOwner(true)
    }
    checkOwner()
  }, [listing.club_id])

  useEffect(() => {
    const timer = setTimeout(() => trackListingView(listing.id), 800)
    return () => clearTimeout(timer)
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
            {t('backToListings')}
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
                      alt={t('photoAlt', { n: i + 1 })}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Expired banner */}
          {isExpired && (
            <div className="mb-4 rounded-xl p-4 flex items-start gap-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(234,88,12,0.10)' }}>
                <Calendar className="w-5 h-5" style={{ color: '#ea580c' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold" style={{ color: '#9a3412' }}>{t('expiredTitle')}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9a3412' }}>
                  {t('expiredOn', { date: expiredDateStr })} {isOwner ? t('expiredHintOwner') : t('expiredHintVisitor')}
                </p>
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
                    {isJob ? t('jobBadge') : t('rentBadge')}
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
                    {t('edit')}
                  </Link>
                )}
              </div>

              {/* ── Description ────────────────────────── */}
              <div style={{ borderTop: '1px solid #f1f5f9' }} className="pt-6">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: '#94a3b8' }}>
                  {t('description')}
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
                        {t('pricing')}
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {listing.rent_price_daily != null && (
                          <div className="rounded-xl p-4 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <p className="text-xl font-bold" style={{ color: '#0f172a' }}>CHF {listing.rent_price_daily}</p>
                            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{t('perDay')}</p>
                          </div>
                        )}
                        {listing.rent_price_weekly != null && (
                          <div className="rounded-xl p-4 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <p className="text-xl font-bold" style={{ color: '#0f172a' }}>CHF {listing.rent_price_weekly}</p>
                            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{t('perWeek')}</p>
                          </div>
                        )}
                        {listing.rent_price_monthly != null && (
                          <div className="rounded-xl p-4 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <p className="text-xl font-bold" style={{ color: '#0f172a' }}>CHF {listing.rent_price_monthly}</p>
                            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{t('perMonth')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Room details & amenities */}
                  {(listing.rent_room_size || listing.rent_work_permit || listing.rent_furnished || listing.rent_kitchen || listing.rent_bathroom || listing.rent_air_conditioning || listing.rent_towels) && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#94a3b8' }}>
                        {t('roomDetails')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {listing.rent_room_size && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', color: '#1D4ED8', border: '1px solid rgba(59,130,246,0.20)' }}>
                            {t('roomSize', { size: listing.rent_room_size })}
                          </span>
                        )}
                        {listing.rent_work_permit && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', color: '#047857', border: '1px solid rgba(16,185,129,0.20)' }}>
                            {t('workPermit')}
                          </span>
                        )}
                        {listing.rent_furnished && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}>
                            {t('furnished')}
                          </span>
                        )}
                        {listing.rent_kitchen && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}>
                            {t('kitchen')}
                          </span>
                        )}
                        {listing.rent_bathroom && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}>
                            {t('bathroom')}
                          </span>
                        )}
                        {listing.rent_air_conditioning && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}>
                            {t('airConditioning')}
                          </span>
                        )}
                        {listing.rent_towels && (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.20)' }}>
                            {t('towels')}
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
                    {t('services')}
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
              <div style={{ borderTop: '1px solid #f1f5f9' }} className="pt-6">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>
                  {t('contact')}
                </p>
                {(listing.phone_number || listing.email || listing.website) ? (
                <>
                  <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
                    {t('tapToContact')}
                  </p>
                  <div className="space-y-2.5">
                    {listing.phone_number && phoneDigitsOk && (
                      <a
                        href={listingTelHref(cc, phone!)}
                        onClick={() => trackListingClick(listing.id, 'phone')}
                        className="group flex items-center gap-3 p-3.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/40 active:scale-[0.99] transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 group-hover:bg-blue-100 transition-colors">
                          <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{t('callNow')}</p>
                          <p className="text-sm font-bold text-slate-900 break-all">{cc} {listing.phone_number}</p>
                        </div>
                        <span className="text-blue-500 text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
                      </a>
                    )}

                    {listing.has_sms && phoneDigitsOk && (
                      <a
                        href={listingSmsHref(cc, phone!)}
                        onClick={() => trackListingClick(listing.id, 'sms')}
                        className="group flex items-center gap-3 p-3.5 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/40 active:scale-[0.99] transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                          <MessageSquare className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{t('sendSms')}</p>
                          <p className="text-sm font-bold text-slate-900 break-all">{cc} {listing.phone_number}</p>
                        </div>
                        <span className="text-emerald-500 text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
                      </a>
                    )}

                    {(listing.has_whatsapp || listing.has_viber || listing.has_telegram) && phoneDigitsOk && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {listing.has_whatsapp && (
                          <a
                            href={listingWhatsAppHref(cc, phone!)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackListingClick(listing.id, 'whatsapp')}
                            className="group flex items-center gap-3 p-3.5 rounded-xl text-white bg-[#25D366] hover:bg-[#1fb955] active:scale-[0.99] transition-all shadow-sm hover:shadow-md"
                          >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/20">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t('chatOn')}</p>
                              <p className="text-sm font-bold">WhatsApp</p>
                            </div>
                            <span className="text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
                          </a>
                        )}
                        {listing.has_viber && (
                          <a
                            href={listingViberHref(cc, phone!)}
                            onClick={() => trackListingClick(listing.id, 'viber')}
                            className="group flex items-center gap-3 p-3.5 rounded-xl text-white bg-[#7360f2] hover:bg-[#5e4dd9] active:scale-[0.99] transition-all shadow-sm hover:shadow-md"
                          >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/20">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t('chatOn')}</p>
                              <p className="text-sm font-bold">Viber</p>
                            </div>
                            <span className="text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
                          </a>
                        )}
                        {listing.has_telegram && (
                          <a
                            href={listingTelegramHref(cc, phone!)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackListingClick(listing.id, 'telegram')}
                            className="group flex items-center gap-3 p-3.5 rounded-xl text-white bg-[#26A5E4] hover:bg-[#1e8bc1] active:scale-[0.99] transition-all shadow-sm hover:shadow-md"
                          >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/20">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t('chatOn')}</p>
                              <p className="text-sm font-bold">Telegram</p>
                            </div>
                            <span className="text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
                          </a>
                        )}
                      </div>
                    )}

                    {listing.email && (
                      <a
                        href={`mailto:${listing.email}`}
                        onClick={() => trackListingClick(listing.id, 'email')}
                        className="group flex items-center gap-3 p-3.5 rounded-xl bg-white border border-pink-200 hover:border-pink-400 hover:bg-pink-50/40 active:scale-[0.99] transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-pink-50 group-hover:bg-pink-100 transition-colors">
                          <Mail className="w-5 h-5 text-pink-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-pink-600">{t('sendEmail')}</p>
                          <p className="text-sm font-bold text-slate-900 break-all">{listing.email}</p>
                        </div>
                        <span className="text-pink-500 text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
                      </a>
                    )}

                    {listing.website && (
                      <a
                        href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackListingClick(listing.id, 'website')}
                        className="group flex items-center gap-3 p-3.5 rounded-xl bg-white border border-violet-200 hover:border-violet-400 hover:bg-violet-50/40 active:scale-[0.99] transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-violet-50 group-hover:bg-violet-100 transition-colors">
                          <Globe className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">{t('visitWebsite')}</p>
                          <p className="text-sm font-bold text-slate-900 break-all">{listing.website}</p>
                        </div>
                        <span className="text-violet-500 text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
                      </a>
                    )}
                  </div>
                </>
                ) : (
                  <div className="rounded-xl p-4 bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      {t('noContact')}
                    </p>
                  </div>
                )}
              </div>

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
                  {t('viewClubProfile', { clubName: listing.club_name })}
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
