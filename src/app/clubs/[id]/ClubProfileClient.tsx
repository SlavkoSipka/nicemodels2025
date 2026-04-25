'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { htmlToPlainText } from '@/lib/plainText'
import {
  Building2, MapPin, Phone, Mail, Globe, MessageCircle,
  Clock, CheckCircle, Coffee, Waves, Trees, DollarSign,
  ChevronLeft, ChevronRight, Users, Sparkles, Eye
} from 'lucide-react'

interface ClubProfileClientProps {
  profile: any
  clubDetails: any
  contactDetails: any
  workingHours: any
  photos: any[]
  clubModels?: any[]
  viewCount?: number
}

export default function ClubProfileClient({
  profile,
  clubDetails,
  contactDetails,
  workingHours,
  photos,
  clubModels = [],
  viewCount = 0,
}: ClubProfileClientProps) {
  const [showContact, setShowContact] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [idCopied, setIdCopied] = useState(false)

  const clubName = clubDetails?.display_name || clubDetails?.club_name || 'Club'
  const publicIdLabel = profile.public_id ? `#${profile.public_id}` : `#${profile.id.slice(0, 6)}`
  const handleCopyId = () => {
    navigator.clipboard.writeText(publicIdLabel)
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 1800)
  }
  const isClub = clubDetails?.is_club || false
  const is24_7 = workingHours?.always_available || false

  useEffect(() => {
    const track = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('club_analytics').insert({
          club_id: profile.id,
          event_type: 'profile_view',
          viewer_id: user?.id || null,
          viewer_role: user ? 'authenticated' : 'guest'
        })
      } catch {}
    }
    track()
  }, [profile.id])

  const handleShowContact = async () => {
    setShowContact(v => !v)
    if (!showContact) {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('club_analytics').insert({
          club_id: profile.id,
          event_type: 'contact_click',
          viewer_id: user?.id || null,
          viewer_role: user ? 'authenticated' : 'guest'
        })
      } catch {}
    }
  }

  const days = [
    { day: 'Monday',    open: workingHours?.monday_open,    close: workingHours?.monday_close },
    { day: 'Tuesday',   open: workingHours?.tuesday_open,   close: workingHours?.tuesday_close },
    { day: 'Wednesday', open: workingHours?.wednesday_open, close: workingHours?.wednesday_close },
    { day: 'Thursday',  open: workingHours?.thursday_open,  close: workingHours?.thursday_close },
    { day: 'Friday',    open: workingHours?.friday_open,    close: workingHours?.friday_close },
    { day: 'Saturday',  open: workingHours?.saturday_open,  close: workingHours?.saturday_close },
    { day: 'Sunday',    open: workingHours?.sunday_open,    close: workingHours?.sunday_close },
  ]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-8">

          {/* ── Hero image (horizontal) ── */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/7] bg-gray-200 rounded-lg overflow-hidden mb-4 sm:mb-8 shadow-sm">
            {photos.length > 0 ? (
              <>
                <Image
                  src={photos[selectedPhotoIndex].url}
                  alt={`${clubName} photo ${selectedPhotoIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1280px"
                  priority
                />
                {/* gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {/* nav arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedPhotoIndex(i => (i + 1) % photos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-4 text-xs font-semibold text-white/80 bg-black/30 px-2 py-0.5 rounded-full">
                      {selectedPhotoIndex + 1} / {photos.length}
                    </div>
                    {/* dot indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.slice(0, 8).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedPhotoIndex(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === selectedPhotoIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Building2 className="w-24 h-24 text-gray-300" />
              </div>
            )}
          </div>

          {/* ── Content grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

            {/* LEFT – main info */}
            <div className="space-y-4">

              {/* Name / type / location */}
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
                <div className="h-1.5 bg-gradient-to-r from-brand via-rose-400 to-pink-300" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-2xl font-bold text-gray-900 leading-tight">{clubName}</h1>
                      <button
                        onClick={handleCopyId}
                        title="Copy ID"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-semibold transition-all cursor-pointer select-none"
                        style={{
                          background: idCopied ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.05)',
                          border: idCopied ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(0,0,0,0.1)',
                          color: idCopied ? '#059669' : '#94a3b8',
                        }}
                      >
                        {idCopied ? '✓ copied' : publicIdLabel}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {viewCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                          {viewCount.toLocaleString()} {viewCount === 1 ? 'view' : 'views'}
                        </span>
                      )}
                      {profile.is_verified && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-500 px-2.5 py-1 rounded-full shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                      <span className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-2.5 py-1 rounded-full">
                        {isClub ? 'Club' : 'Agency'}
                      </span>
                    </div>
                  </div>
                  {clubDetails?.club_name && clubDetails?.display_name && clubDetails.club_name !== clubDetails.display_name && (
                    <p className="text-sm text-gray-400 mb-2">({clubDetails.club_name})</p>
                  )}
                  {clubDetails?.area && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full px-3 py-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-brand" /> {clubDetails.area}
                    </span>
                  )}
                </div>
              </div>

              {/* About */}
              {clubDetails?.about_description && (
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-violet-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">About Us</p>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{htmlToPlainText(clubDetails.about_description || '')}</p>
                </div>
              )}

              {/* Club Features */}
              {isClub && (clubDetails?.entrance_fee || clubDetails?.wellness || clubDetails?.food_and_drinks || clubDetails?.outdoor_area) && (
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-brand" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">Club Features</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {clubDetails?.entrance_fee && clubDetails.entrance_fee !== 'na' && (
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-gray-400 font-medium">Entrance Fee</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{clubDetails.entrance_fee.replace('_', ' ')}</p>
                      </div>
                    )}
                    {clubDetails?.wellness && clubDetails.wellness !== 'na' && (
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Waves className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-gray-400 font-medium">Wellness</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{clubDetails.wellness}</p>
                      </div>
                    )}
                    {clubDetails?.food_and_drinks && clubDetails.food_and_drinks !== 'na' && (
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Coffee className="w-4 h-4 text-amber-600" />
                          <span className="text-xs text-gray-400 font-medium">Food & Drinks</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{clubDetails.food_and_drinks}</p>
                      </div>
                    )}
                    {clubDetails?.outdoor_area && clubDetails.outdoor_area !== 'na' && (
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Trees className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-400 font-medium">Outdoor Area</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{clubDetails.outdoor_area}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Address */}
              {(clubDetails?.street || clubDetails?.city) && (
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-rose-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">Address</p>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700">
                    {clubDetails.street && (
                      <p className="font-medium">{clubDetails.street} {clubDetails.street_number}</p>
                    )}
                    {clubDetails.city && (
                      <p className="text-gray-500">{clubDetails.zip_code && `${clubDetails.zip_code} `}{clubDetails.city}</p>
                    )}
                    {clubDetails.additional_info && (
                      <p className="text-gray-400 text-xs mt-1">{clubDetails.additional_info}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Club Models */}
              {clubModels.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-brand" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">Our Models</p>
                    <span className="ml-auto text-xs font-semibold text-gray-400">{clubModels.length}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {clubModels.map(model => (
                      <Link
                        key={model.id}
                        href={`/models/${model.id}`}
                        className="group block rounded-lg overflow-hidden border border-gray-100 hover:border-brand/30 hover:shadow-md transition-all"
                      >
                        <div className="relative aspect-[3/4] bg-gray-100">
                          {model.photoUrl ? (
                            <Image
                              src={model.photoUrl}
                              alt={model.showname || model.username}
                              fill
                              className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                              sizes="(max-width: 640px) 45vw, 180px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          {model.is_verified && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-brand transition-colors">
                            {model.showname || model.username}
                          </p>
                          {(model.city || model.age) && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {[model.age ? `${model.age} yrs` : '', model.city].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT – contact + hours */}
            <div className="space-y-4">

              {/* Contact card */}
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
                <div className="bg-gradient-to-r from-brand to-rose-500 px-5 py-4">
                  <p className="text-sm font-bold text-white">Contact</p>
                </div>
                <div className="p-5">
                  {!showContact ? (
                    <button
                      onClick={handleShowContact}
                      className="w-full py-2.5 bg-gradient-to-r from-brand to-rose-500 hover:from-brand-hover hover:to-rose-600 text-white font-bold rounded-md transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                    >
                      <Phone className="w-4 h-4" /> Show Contact Info
                    </button>
                  ) : contactDetails ? (
                    <div className="space-y-3">
                      {contactDetails.phone_number && (
                        <div>
                          <a
                            href={`tel:${contactDetails.country_code}${contactDetails.phone_number}`}
                            className="text-xl font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                          >
                            {contactDetails.country_code} {contactDetails.phone_number}
                          </a>
                          {(contactDetails.has_whatsapp || contactDetails.has_viber || contactDetails.has_telegram) && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {contactDetails.has_whatsapp && <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 font-semibold rounded-full">WhatsApp</span>}
                              {contactDetails.has_viber && <span className="text-xs px-2.5 py-1 bg-purple-100 text-purple-700 font-semibold rounded-full">Viber</span>}
                              {contactDetails.has_telegram && <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 font-semibold rounded-full">Telegram</span>}
                            </div>
                          )}
                        </div>
                      )}
                      {contactDetails.email && (
                        <a href={`mailto:${contactDetails.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand">
                          <Mail className="w-4 h-4 text-brand" /> {contactDetails.email}
                        </a>
                      )}
                      {contactDetails.website && (
                        <a
                          href={contactDetails.website.startsWith('http') ? contactDetails.website : `https://${contactDetails.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand"
                        >
                          <Globe className="w-4 h-4 text-brand" /> {contactDetails.website}
                        </a>
                      )}
                      {(contactDetails.contact_instruction || contactDetails.other_instructions) && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-400 font-medium mb-1">Instructions</p>
                          {contactDetails.contact_instruction && (
                            <p className="text-sm text-gray-600 capitalize">{contactDetails.contact_instruction.replace(/_/g, ' ')}</p>
                          )}
                          {contactDetails.other_instructions && (
                            <p className="text-sm text-gray-500 italic">{contactDetails.other_instructions}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">Contact information not available</p>
                  )}
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Working hours</p>
                </div>
                {is24_7 ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-md">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-sm font-bold text-emerald-700">Available 24 / 7</span>
                  </div>
                ) : workingHours ? (
                  <div className="space-y-1.5">
                    {days.map(({ day, open, close }) => (
                      <div key={day} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600">{day}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {open && close ? `${open} – ${close}` : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Working hours not specified</p>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
