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

export default function ListingDetailClient({ listing }: { listing: ListingDetail }) {
  const [isOwner, setIsOwner] = useState(false)

  const displayTitle = listing.title || (listing.listing_type === 'job' ? 'Job Listing' : 'Rent Listing')

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
      <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 280px, #1f2126 280px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Back button */}
          <Link
            href="/jobs-rents"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to listings
          </Link>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
            <div className="p-6 sm:p-8 space-y-6">

              {/* Header */}
              <div>
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 ${
                  listing.listing_type === 'job'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {listing.listing_type === 'job' ? 'Job' : 'Rent'}
                </span>

                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {displayTitle}
                  </h1>
                  {isOwner && (
                    <Link
                      href={`/dashboard/company/jobs-rent/edit/${listing.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover transition-colors shrink-0"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <Link
                    href={`/clubs/${listing.club_id}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-brand transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    {listing.club_name}
                  </Link>
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {listing.location}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(listing.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Description</h2>
                <div
                  className="text-base text-gray-700 leading-relaxed rich-text-content"
                  dangerouslySetInnerHTML={{ __html: listing.description }}
                />
              </div>

              {/* Services */}
              {listing.services.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Services</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.services.map(s => (
                      <span
                        key={s.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand/10 text-brand border border-brand/20"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact */}
              {(listing.phone_number || listing.email || listing.website) && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Contact</h2>
                  <div className="space-y-3">
                    {listing.phone_number && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-brand" />
                        </div>
                        <div>
                          <a
                            href={`tel:${listing.country_code}${listing.phone_number}`}
                            className="text-sm font-semibold text-gray-900 hover:text-brand transition-colors"
                          >
                            {listing.country_code} {listing.phone_number}
                          </a>
                          <div className="flex gap-1.5 mt-1">
                            {listing.has_whatsapp && <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 font-semibold rounded-full">WhatsApp</span>}
                            {listing.has_viber && <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 font-semibold rounded-full">Viber</span>}
                            {listing.has_telegram && <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 font-semibold rounded-full">Telegram</span>}
                          </div>
                        </div>
                      </div>
                    )}

                    {listing.email && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-brand" />
                        </div>
                        <a
                          href={`mailto:${listing.email}`}
                          className="text-sm font-semibold text-gray-900 hover:text-brand transition-colors"
                        >
                          {listing.email}
                        </a>
                      </div>
                    )}

                    {listing.website && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-brand" />
                        </div>
                        <a
                          href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-gray-900 hover:text-brand transition-colors"
                        >
                          {listing.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photos grid */}
              {listing.photos.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Photos</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {listing.photos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
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

              {/* Club link */}
              <div className="pt-4 border-t border-gray-100">
                <Link
                  href={`/clubs/${listing.club_id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
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
