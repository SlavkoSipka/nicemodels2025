'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import { MapPin, Building2, Users, CheckCircle } from 'lucide-react'

interface Club {
  id: string
  username: string
  club_name: string
  display_name: string
  area: string
  is_club: boolean
  photoUrl: string | null
}

export default function ClubsPageClient() {
  const [loading, setLoading] = useState(true)
  const [clubs, setClubs] = useState<Club[]>([])
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([])
  const [selectedArea, setSelectedArea] = useState<string>('all')

  useEffect(() => {
    loadClubs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [selectedArea, clubs])

  const loadClubs = async () => {
    try {
      const supabase = createClient()

      // Call RPC function to get clubs with active ads
      const { data: clubsData, error: clubsError } = await supabase
        .rpc('clubs_with_active_ads')

      if (clubsError) {
        console.error('Clubs error (RPC clubs_with_active_ads):', clubsError)
        setClubs([])
        setFilteredClubs([])
      } else if (clubsData && clubsData.length > 0) {
        await processClubs(supabase, clubsData)
      } else {
        setClubs([])
        setFilteredClubs([])
      }
    } catch (error) {
      console.error('Error loading clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  const processClubs = async (supabase: any, clubsData: any[]) => {
    try {
      const clubsWithDetails = await Promise.all(
        clubsData.map(async (club: any) => {
          // Get first photo
          const { data: photos } = await supabase
            .from('club_photos')
            .select('file_path')
            .eq('club_id', club.id)
            .eq('is_approved', true)
            .limit(1)

          let photoUrl = null
          if (photos && photos.length > 0) {
            const { data: urlData } = supabase.storage
              .from('club-photos')
              .getPublicUrl(photos[0].file_path)
            photoUrl = urlData.publicUrl
          }

          return {
            id: club.id,
            username: club.username,
            club_name: club.club_name,
            display_name: club.display_name,
            area: club.area,
            is_club: club.is_club,
            photoUrl
          }
        })
      )

      setClubs(clubsWithDetails)
      setFilteredClubs(clubsWithDetails)
    } catch (error) {
      console.error('Error processing clubs:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...clubs]

    if (selectedArea !== 'all') {
      filtered = filtered.filter((club) => club.area === selectedArea)
    }

    setFilteredClubs(filtered)
  }

  const allAreas = Array.from(new Set(clubs.map(c => c.area).filter(Boolean)))

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center gap-3">
              <Building2 className="w-10 h-10 text-pink-600" />
              Clubs & Agencies
            </h1>
            <p className="text-gray-600 text-lg">
              Discover the best clubs and escort agencies in Switzerland
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <label className="font-semibold text-gray-900">Filter by Area:</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">All Areas</option>
                {allAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <span className="text-gray-600 text-sm ml-auto">
                {filteredClubs.length} {filteredClubs.length === 1 ? 'result' : 'results'}
              </span>
            </div>
          </div>

          {/* Clubs List - Horizontal Layout */}
          {filteredClubs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Clubs Found</h3>
              <p className="text-gray-600">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col md:flex-row"
                >
                  {/* Photo - Left Side */}
                  <div className="relative md:w-80 h-64 md:h-auto bg-gradient-to-br from-pink-100 to-rose-100 flex-shrink-0">
                    {club.photoUrl ? (
                      <Image
                        src={club.photoUrl}
                        alt={club.display_name || club.club_name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-pink-300" />
                      </div>
                    )}
                    {/* Type Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-pink-600">
                        {club.is_club ? 'Club' : 'Agency'}
                      </span>
                    </div>
                  </div>

                  {/* Info - Right Side */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                          {club.display_name || club.club_name}
                        </h3>
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 ml-2" />
                      </div>
                      
                      {club.area && (
                        <div className="flex items-center gap-2 text-gray-600 mb-4">
                          <MapPin className="w-5 h-5" />
                          <span className="text-lg">{club.area}</span>
                        </div>
                      )}

                      {/* Description placeholder - možeš dodati klub description iz baze */}
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Professional {club.is_club ? 'club' : 'escort agency'} providing high-quality services in Switzerland.
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <span className="text-pink-600 font-semibold group-hover:text-pink-700 transition-colors inline-flex items-center gap-2">
                        View Details & Contact Info
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
