import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin,
  Star,
  CheckCircle,
  Heart,
  Share2,
  Flag,
  Phone,
  MessageSquare,
  Clock,
  DollarSign,
  User,
  Ruler,
  Languages as LanguagesIcon,
  Calendar,
} from 'lucide-react'
import PhotoGallery from '@/components/profile/PhotoGallery'
import ReviewsList from '@/components/profile/ReviewsList'
import ContactButtons from '@/components/profile/ContactButtons'
import SimilarProfiles from '@/components/profile/SimilarProfiles'
import { htmlToPlainText } from '@/lib/plainText'
import { getProfileById, getModelRating } from '@/lib/api/profiles'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params
  return {
    alternates: { canonical: `https://www.nicemodels.ch/models/${id}` },
    robots: { index: false, follow: true },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // Unwrap params immediately to avoid React DevTools enumeration issues
  const resolvedParams = await params
  const { id } = resolvedParams

  // Create Supabase server client
  const supabase = await createClient()
  const tNav = await getTranslations('nav')
  const tProfile = await getTranslations('publicPages.profile')
  const tDay = await getTranslations('onboarding.model.day')
  const tModel = await getTranslations('models.profile')

  // Fetch profile from Supabase
  const profileData = await getProfileById(id, supabase)
  
  if (!profileData) {
    notFound()
  }
  
  // Ako korisnik nije model, prikaži osnovni profil
  if (!profileData.model_details) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto px-4 max-w-full">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h1 className="text-3xl font-bold mb-4">
              {profileData.full_name || profileData.username || 'User'}
            </h1>
            <p className="text-gray-600">{tProfile('notAModel')}</p>
          </div>
        </div>
      </div>
    )
  }

  // Get rating
  const rating = await getModelRating(id, supabase)

  // Days of week indexed 0=Sunday..6=Saturday to match DB convention
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

  const availability = Array.from({ length: 7 }, (_, i) => {
    const slot = profileData.availability?.find(a => a.day_of_week === i)
    const isOpen = !!(slot && slot.is_available)
    return {
      day: tDay(dayKeys[i]),
      hours: isOpen
        ? `${slot!.start_time.slice(0, 5)} - ${slot!.end_time.slice(0, 5)}`
        : tProfile('closed'),
      isOpen,
    }
  })

  const profile = {
    id,
    name: profileData.full_name || tModel('fallbackModel'),
    age: profileData.model_details.age || 0,
    city: profileData.model_details.location_city || tProfile('unknown'),
    country: profileData.model_details.location_country || tProfile('unknown'),
    price: profileData.model_details.price_per_hour || 0,
    rating: rating.rating,
    reviews: rating.count,
    verified: profileData.is_verified,
    online: false, // TODO: implement online status
    height: profileData.model_details.height || 0,
    languages: profileData.model_details?.speaks_languages || [],
    bio: profileData.model_details.bio || tProfile('noBio'),
    services: profileData.model_details.services || [],
    availability,
    photos: profileData.photos?.map(p => p.photo_url) || [],
    pricing: {
      '30min': Math.round((profileData.model_details.price_per_hour || 0) * 0.6),
      '1hour': profileData.model_details.price_per_hour || 0,
      '2hours': Math.round((profileData.model_details.price_per_hour || 0) * 1.8),
      'overnight': Math.round((profileData.model_details.price_per_hour || 0) * 4.5),
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50/30 to-white py-8">
      <div className="mx-auto px-4 max-w-full">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 inline-block shadow-soft">
          <Link href="/" className="hover:text-pink-600 font-medium transition-colors">{tNav('home')}</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/search" className="hover:text-pink-600 font-medium transition-colors">{tNav('search')}</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 font-semibold">{profile.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-large p-8 border border-gray-100 animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-gray-800">
                      {profile.name}, {profile.age}
                      <span className="ml-2 text-sm font-mono font-normal align-middle text-gray-400">
                        #{profileData.public_id || id.slice(0, 6)}
                      </span>
                    </h1>
                    {profile.verified && (
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-sm flex items-center shadow-lg">
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Verified
                      </div>
                    )}
                    {profile.online && (
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1.5 rounded-full text-sm flex items-center shadow-lg">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                        Online Now
                      </div>
                    )}
                  </div>
                  
                  <p className="text-lg text-gray-600 flex items-center mb-3">
                    <MapPin className="w-5 h-5 mr-2 text-pink-500" />
                    {profile.city}, {profile.country}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-700">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" />
                      <span className="font-semibold text-lg">{profile.rating}</span>
                      <span className="ml-1">({profile.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="p-3 bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 rounded-xl transition-all shadow-soft hover:shadow-md hover:scale-110 border border-pink-200">
                    <Heart className="w-5 h-5 text-pink-600" />
                  </button>
                  <button className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all shadow-soft hover:shadow-md hover:scale-110 border border-gray-200">
                    <Share2 className="w-5 h-5 text-gray-700" />
                  </button>
                  <button className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all shadow-soft hover:shadow-md hover:scale-110 border border-gray-200">
                    <Flag className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <User className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                  <div className="text-sm text-gray-600">Age</div>
                  <div className="font-semibold">{profile.age} years</div>
                </div>
                {profile.height > 0 && (
                  <div className="text-center">
                    <Ruler className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                    <div className="text-sm text-gray-600">Height</div>
                    <div className="font-semibold">{profile.height} cm</div>
                  </div>
                )}
                <div className="text-center">
                  <LanguagesIcon className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                  <div className="text-sm text-gray-600">Languages</div>
                  <div className="font-semibold">{profile.languages.length}</div>
                </div>
                <div className="text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                  <div className="text-sm text-gray-600">From</div>
                  <div className="font-semibold">${profile.price}/hr</div>
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            <PhotoGallery photos={profile.photos} />

            {/* About */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-large p-8 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">About Me</h2>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">{htmlToPlainText(profile.bio || '')}</p>
            </div>

            {/* Services */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-large p-8 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Services Offered</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.services.map((service) => (
                  <div
                    key={service}
                    className="flex items-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200 shadow-soft hover:shadow-md transition-all"
                  >
                    <CheckCircle className="w-5 h-5 text-pink-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-800 text-sm font-medium">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-large p-8 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Languages</h2>
              <div className="flex flex-wrap gap-3">
                {profile.languages.map((lang) => (
                  <div
                    key={lang}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  >
                    {lang}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <ReviewsList profileId={id} rating={profile.rating} totalReviews={profile.reviews} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-large p-8 border border-gray-100 sticky top-20 animate-fade-in">
              <div className="mb-6">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  ${profile.price}
                </div>
                <div className="text-gray-600 font-medium">per hour</div>
              </div>

              <ContactButtons contactDetails={profileData.contact_details} profileId={id} />

              {/* Pricing Table */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Pricing</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(profile.pricing).map(([duration, price]) => (
                    <div key={duration} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{duration.replace('_', ' ')}</span>
                      <span className="font-semibold">${price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-large p-8 border border-gray-100">
              <h3 className="font-bold text-lg mb-6 flex items-center text-gray-900">
                <div className="bg-pink-500 rounded-lg p-2 mr-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                Availability
              </h3>
              <div className="space-y-3">
                {profile.availability.map((slot) => (
                  <div key={slot.day} className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <span className="text-gray-700 font-medium">{slot.day}</span>
                    <span className={`font-bold px-3 py-1 rounded-lg ${slot.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {slot.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Notice */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6 shadow-soft">
              <h3 className="font-bold mb-3 text-yellow-900 flex items-center">
                <span className="text-2xl mr-2">🛡️</span>
                Safety First
              </h3>
              <p className="text-sm text-yellow-800 leading-relaxed">
                Always meet in public first. Never send money in advance. Report suspicious behavior.
              </p>
            </div>
          </div>
        </div>

        {/* Similar Profiles */}
        <SimilarProfiles currentProfileId={id} city={profile.city} supabase={supabase} />
      </div>
    </div>
  )
}

