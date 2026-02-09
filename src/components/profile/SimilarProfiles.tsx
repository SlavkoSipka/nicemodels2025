import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, CheckCircle } from 'lucide-react'
import { getSimilarProfiles, getPrimaryPhoto, getModelRating } from '@/lib/api/profiles'

interface SimilarProfilesProps {
  currentProfileId: string
  city: string
}

export default async function SimilarProfiles({ currentProfileId, city }: SimilarProfilesProps) {
  // Fetch similar profiles from Supabase
  const profilesData = await getSimilarProfiles(currentProfileId, city, 4)
  
  // Get ratings
  const profiles = await Promise.all(
    profilesData.map(async (profile) => {
      const rating = await getModelRating(profile.id)
      return {
        ...profile,
        rating: rating.rating,
        reviewCount: rating.count,
      }
    })
  )

  if (profiles.length === 0) {
    return null
  }

  // Mock fallback data if no profiles found
  const mockProfiles = [
    {
      id: '2',
      name: 'Laura',
      age: 28,
      city: 'Basel',
      price: 300,
      rating: 5.0,
      reviews: 89,
      verified: true,
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop',
    },
    {
      id: '3',
      name: 'Sofia',
      age: 26,
      city: 'Basel',
      price: 280,
      rating: 4.8,
      reviews: 156,
      verified: true,
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop',
    },
    {
      id: '4',
      name: 'Emma',
      age: 24,
      city: 'Basel',
      price: 220,
      rating: 4.9,
      reviews: 203,
      verified: false,
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop',
    },
    {
      id: '5',
      name: 'Isabella',
      age: 27,
      city: 'Basel',
      price: 350,
      rating: 4.9,
      reviews: 178,
      verified: true,
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop',
    },
  ]

  return (
    <section className="mt-16">
      <h2 className="text-3xl font-bold mb-8">
        Similar Models in <span className="text-pink-600">{city}</span>
      </h2>

      <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9">
        {(profiles.length > 0 ? profiles : mockProfiles).map((profile) => (
          <Link
            key={profile.id}
            href={`/profile/${profile.id}`}
            className="group bg-white rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 m-3"
          >
            {/* Image */}
            <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-200">
              <Image
                src={'image' in profile ? profile.image : getPrimaryPhoto(profile.photos)}
                alt={'name' in profile ? profile.name : profile.full_name || 'Model'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {('verified' in profile ? profile.verified : profile.is_verified) && (
                <div className="absolute top-1 right-1 bg-blue-500 text-white px-1 py-0.5 rounded text-[9px] flex items-center">
                  <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                  Verified
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-1.5">
              <h3 className="font-semibold text-gray-800 text-[12px] truncate">
                {'name' in profile ? profile.name : profile.full_name || 'Model'}
              </h3>
              <p className="text-[10px] text-gray-600 mt-0.5 truncate flex items-center">
                <MapPin className="w-3 h-3 mr-0.5" />
                {'city' in profile ? profile.city : profile.model_details?.location_city || 'Unknown'}
              </p>
              {('rating' in profile ? profile.rating : (profile as any).rating) && (
                <div className="flex items-center text-[10px] text-gray-600 mt-0.5">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-0.5" />
                  <span className="font-semibold">
                    {'rating' in profile ? profile.rating : (profile as any).rating || '0.0'}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

