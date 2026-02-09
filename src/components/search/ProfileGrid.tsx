'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, CheckCircle, Heart, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import { searchProfiles, getPrimaryPhoto, getModelRating, type Profile } from '@/lib/api/profiles'
import { createClient } from '@/lib/supabase/client'

export default function ProfileGrid() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true)
      const result = await searchProfiles({}, 1, 12, supabase)
      
      // Get ratings for each profile
      const profilesWithRatings = await Promise.all(
        result.profiles.map(async (profile) => {
          const rating = await getModelRating(profile.id, supabase)
          return {
            ...profile,
            rating: rating.rating,
            reviewCount: rating.count,
          }
        })
      )
      
      setProfiles(profilesWithRatings as any)
      setTotal(result.total)
      setLoading(false)
    }

    fetchProfiles()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <p className="mt-4 text-gray-600">Loading profiles...</p>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">No profiles found.</p>
        <p className="mt-2 text-gray-500">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{profiles.length}</span> of <span className="font-semibold">{total}</span> results
        </p>
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
          <option>Most Recent</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Top Rated</option>
          <option>Most Reviewed</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9">
        {profiles.map((profile) => (
          <Link
            key={profile.id}
            href={`/profile/${profile.id}`}
            className="group bg-white rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 m-3"
          >
            {/* Image */}
            <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-200">
              <Image
                src={getPrimaryPhoto(profile.photos)}
                alt={profile.full_name || 'Model'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Badges */}
              <div className="absolute top-1 left-1 right-1 flex items-start justify-between">
                {profile.is_verified && (
                  <div className="bg-blue-500 text-white px-1 py-0.5 rounded text-[9px] flex items-center">
                    <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                    Verified
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-1.5">
              <h3 className="font-semibold text-gray-800 text-[12px] truncate">
                {profile.full_name || 'Model'}
              </h3>
              <p className="text-[10px] text-gray-600 mt-0.5 truncate flex items-center">
                <MapPin className="w-3 h-3 mr-0.5" />
                {profile.model_details?.location_city || 'Unknown'}
              </p>
              {(profile as any).rating && (
                <div className="flex items-center text-[10px] text-gray-600 mt-0.5">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-0.5" />
                  <span className="font-semibold">{(profile as any).rating || '0.0'}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center">
        <nav className="flex items-center space-x-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Previous
          </button>
          <button className="px-4 py-2 bg-pink-500 text-white rounded-lg">1</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">2</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">3</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Next
          </button>
        </nav>
      </div>
    </div>
  )
}

