'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/client'
import { Building2, MapPin, Phone, Mail, Globe, MessageCircle, Clock, CheckCircle, Coffee, Waves, Trees, DollarSign } from 'lucide-react'

interface ClubProfileClientProps {
  profile: any
  clubDetails: any
  contactDetails: any
  workingHours: any
  photos: any[]
}

export default function ClubProfileClient({
  profile,
  clubDetails,
  contactDetails,
  workingHours,
  photos
}: ClubProfileClientProps) {
  const [showContact, setShowContact] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  const clubName = clubDetails?.display_name || clubDetails?.club_name || 'Club'
  const isClub = clubDetails?.is_club || false

  // Check if available 24/7
  const is24_7 = workingHours?.always_available || false

  // Track profile view on mount
  useEffect(() => {
    const trackProfileView = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        await supabase.from('club_analytics').insert({
          club_id: profile.id,
          event_type: 'profile_view',
          viewer_id: user?.id || null,
          viewer_role: user ? 'authenticated' : 'guest'
        })
      } catch (error) {
        console.error('Analytics tracking error:', error)
      }
    }

    trackProfileView()
  }, [profile.id])

  // Track contact info click
  const handleShowContact = async () => {
    setShowContact(!showContact)
    
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
      } catch (error) {
        console.error('Analytics tracking error:', error)
      }
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
            
            {/* LEFT COLUMN - Photos (Sticky) */}
            <div className="lg:sticky lg:top-8 lg:self-start space-y-4">
              {/* Main Photo */}
              {photos.length > 0 ? (
                <>
                  <div className="relative aspect-[9/16] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={photos[selectedPhotoIndex].url}
                      alt={`${clubName} photo ${selectedPhotoIndex + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                    />
                  </div>
                  
                  {/* Photo Thumbnails */}
                  {photos.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {photos.slice(0, 8).map((photo, index) => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedPhotoIndex(index)}
                          className={`relative aspect-square rounded-lg overflow-hidden ${
                            selectedPhotoIndex === index ? 'ring-4 ring-pink-500' : ''
                          }`}
                        >
                          <Image
                            src={photo.url}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover hover:scale-110 transition-transform"
                            sizes="100px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[9/16] bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-24 h-24 text-pink-300" />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - Club Information */}
            <div className="space-y-6">
              
              {/* Club Name & Type */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold text-gray-900">{clubName}</h1>
                      {profile.is_verified && (
                        <CheckCircle className="w-7 h-7 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    {clubDetails?.club_name && clubDetails?.display_name && clubDetails.club_name !== clubDetails.display_name && (
                      <p className="text-gray-600 text-sm">({clubDetails.club_name})</p>
                    )}
                  </div>
                  <div className="bg-pink-100 px-4 py-2 rounded-full">
                    <span className="text-pink-700 font-bold text-sm">
                      {isClub ? 'Club' : 'Agency'}
                    </span>
                  </div>
                </div>

                {/* Location */}
                {clubDetails?.area && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-pink-600" />
                    <span className="text-lg">{clubDetails.area}</span>
                  </div>
                )}
              </div>

              {/* About Description */}
              {clubDetails?.about_description && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-pink-600" />
                    About Us
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {clubDetails.about_description}
                  </p>
                </div>
              )}

              {/* Club Features */}
              {isClub && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Club Features</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Entrance Fee */}
                    {clubDetails?.entrance_fee && clubDetails.entrance_fee !== 'na' && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <DollarSign className="w-5 h-5 text-pink-600" />
                        <div>
                          <p className="text-xs text-gray-600">Entrance Fee</p>
                          <p className="font-semibold text-gray-900 capitalize">
                            {clubDetails.entrance_fee.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Wellness */}
                    {clubDetails?.wellness && clubDetails.wellness !== 'na' && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Waves className="w-5 h-5 text-pink-600" />
                        <div>
                          <p className="text-xs text-gray-600">Wellness</p>
                          <p className="font-semibold text-gray-900 capitalize">{clubDetails.wellness}</p>
                        </div>
                      </div>
                    )}

                    {/* Food & Drinks */}
                    {clubDetails?.food_and_drinks && clubDetails.food_and_drinks !== 'na' && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Coffee className="w-5 h-5 text-pink-600" />
                        <div>
                          <p className="text-xs text-gray-600">Food & Drinks</p>
                          <p className="font-semibold text-gray-900 capitalize">{clubDetails.food_and_drinks}</p>
                        </div>
                      </div>
                    )}

                    {/* Outdoor Area */}
                    {clubDetails?.outdoor_area && clubDetails.outdoor_area !== 'na' && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Trees className="w-5 h-5 text-pink-600" />
                        <div>
                          <p className="text-xs text-gray-600">Outdoor Area</p>
                          <p className="font-semibold text-gray-900 capitalize">{clubDetails.outdoor_area}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Working Hours */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-pink-600" />
                  Working Hours
                </h2>
                {is24_7 ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 font-bold text-lg">24/7 Available</span>
                  </div>
                ) : workingHours ? (
                  <div className="space-y-2">
                    {[
                      { day: 'Monday', open: workingHours.monday_open, close: workingHours.monday_close },
                      { day: 'Tuesday', open: workingHours.tuesday_open, close: workingHours.tuesday_close },
                      { day: 'Wednesday', open: workingHours.wednesday_open, close: workingHours.wednesday_close },
                      { day: 'Thursday', open: workingHours.thursday_open, close: workingHours.thursday_close },
                      { day: 'Friday', open: workingHours.friday_open, close: workingHours.friday_close },
                      { day: 'Saturday', open: workingHours.saturday_open, close: workingHours.saturday_close },
                      { day: 'Sunday', open: workingHours.sunday_open, close: workingHours.sunday_close },
                    ].map(({ day, open, close }) => (
                      <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="font-semibold text-gray-700">{day}</span>
                        <span className="text-gray-600">
                          {open && close ? `${open} - ${close}` : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Working hours not specified</p>
                )}
              </div>

              {/* Address */}
              {(clubDetails?.street || clubDetails?.city) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-pink-600" />
                    Address
                  </h2>
                  <div className="space-y-2 text-gray-700">
                    {clubDetails.street && (
                      <p className="text-lg">
                        {clubDetails.street} {clubDetails.street_number}
                      </p>
                    )}
                    {clubDetails.city && (
                      <p className="text-lg">
                        {clubDetails.zip_code && `${clubDetails.zip_code} `}
                        {clubDetails.city}
                      </p>
                    )}
                    {clubDetails.additional_info && (
                      <p className="text-sm text-gray-600 mt-2">{clubDetails.additional_info}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Button */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <button
                  onClick={handleShowContact}
                  className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-bold hover:from-pink-700 hover:to-rose-700 transition-all shadow-md text-lg"
                >
                  {showContact ? 'Hide Contact Info' : 'Show Contact Info'}
                </button>

                {/* Contact Details - Shown when button clicked */}
                {showContact && contactDetails && (
                  <div className="mt-6 p-4 bg-pink-50 rounded-xl space-y-4 border-2 border-pink-200">
                    <h3 className="font-bold text-gray-900 text-lg mb-3">Contact Information</h3>
                    
                    {/* Phone */}
                    {contactDetails.phone_number && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <a
                            href={`tel:${contactDetails.country_code}${contactDetails.phone_number}`}
                            className="text-gray-900 font-semibold hover:text-pink-600 transition-colors"
                          >
                            {contactDetails.country_code} {contactDetails.phone_number}
                          </a>
                          <div className="flex gap-2 mt-1">
                            {contactDetails.has_whatsapp && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">WhatsApp</span>
                            )}
                            {contactDetails.has_viber && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Viber</span>
                            )}
                            {contactDetails.has_telegram && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Telegram</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {contactDetails.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <a
                            href={`mailto:${contactDetails.email}`}
                            className="text-gray-900 font-semibold hover:text-pink-600 transition-colors break-all"
                          >
                            {contactDetails.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Website */}
                    {contactDetails.website && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Website</p>
                          <a
                            href={contactDetails.website.startsWith('http') ? contactDetails.website : `https://${contactDetails.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 font-semibold hover:text-pink-600 transition-colors break-all"
                          >
                            {contactDetails.website}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Additional Instructions */}
                    {(contactDetails.contact_instruction || contactDetails.other_instructions) && (
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">Contact Instructions</p>
                          {contactDetails.contact_instruction && (
                            <p className="text-gray-900 capitalize mb-1">
                              {contactDetails.contact_instruction.replace(/_/g, ' ')}
                            </p>
                          )}
                          {contactDetails.other_instructions && (
                            <p className="text-gray-700 text-sm">{contactDetails.other_instructions}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {showContact && !contactDetails && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center text-gray-600">
                    Contact information not available
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
