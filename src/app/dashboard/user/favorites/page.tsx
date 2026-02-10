'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, Search, Loader2, MapPin, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface FavoriteModel {
  id: string
  created_at: string
  model: {
    id: string
    username: string
    email: string
    model_details: {
      showname: string
      city: string
      age: number
    }[]
    model_photos: {
      file_path: string
    }[]
  }
}

export default function UserFavorites() {
  const [favorites, setFavorites] = useState<FavoriteModel[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // First, get favorites with model_id
    const { data: favoritesData, error: favError } = await supabase
      .from('favorites')
      .select('id, created_at, model_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (favError) {
      console.error('Error loading favorites:', favError)
      setLoading(false)
      return
    }

    console.log('Favorites data:', favoritesData)

    if (!favoritesData || favoritesData.length === 0) {
      console.log('No favorites found')
      setLoading(false)
      return
    }

    // Get model IDs
    const modelIds = favoritesData.map(f => f.model_id)

    // Fetch model profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, email')
      .in('id', modelIds)

    console.log('Profiles data:', profilesData, 'Error:', profilesError)

    // Fetch model details
    const { data: detailsData, error: detailsError } = await supabase
      .from('model_details')
      .select('model_id, showname, city, age')
      .in('model_id', modelIds)

    console.log('Details data:', detailsData, 'Error:', detailsError)

    // Fetch model photos (only approved ones)
    const { data: photosData, error: photosError } = await supabase
      .from('model_photos')
      .select('model_id, file_path')
      .in('model_id', modelIds)
      .eq('is_approved', true)
      .order('uploaded_at', { ascending: false })

    console.log('Photos data:', photosData, 'Error:', photosError)

    // Combine data
    const combinedData = favoritesData.map(fav => {
      const profile = profilesData?.find(p => p.id === fav.model_id)
      const details = detailsData?.find(d => d.model_id === fav.model_id)
      const photo = photosData?.find(p => p.model_id === fav.model_id)

      return {
        id: fav.id,
        created_at: fav.created_at,
        model: {
          id: fav.model_id,
          username: profile?.username || '',
          email: profile?.email || '',
          model_details: details ? [details] : [],
          model_photos: photo ? [photo] : []
        }
      }
    })

    setFavorites(combinedData as any)
    setLoading(false)
  }

  const removeFavorite = async (favoriteId: string) => {
    setRemoving(favoriteId)
    const supabase = createClient()

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId)

    if (!error) {
      setFavorites(favorites.filter(f => f.id !== favoriteId))
    }

    setRemoving(null)
  }

  if (loading) {
    return (
      <div className="ml-[280px] min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="ml-[280px] min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
          <p className="text-gray-600">
            {favorites.length > 0 
              ? `You have ${favorites.length} saved ${favorites.length === 1 ? 'model' : 'models'}`
              : 'Models and clubs you\'ve saved'}
          </p>
        </div>

        {favorites.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-pink-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                No Favorites Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start exploring and save your favorite models and clubs to see them here. 
                Click the heart icon on any profile to add it to your favorites.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold rounded-lg transition-all shadow-lg"
              >
                <Search className="w-5 h-5" />
                Browse Models
              </a>
            </div>
          </div>
        ) : (
          /* Favorites Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const modelDetails = favorite.model?.model_details?.[0]
              const firstPhoto = favorite.model?.model_photos?.[0]
              const photoUrl = firstPhoto?.file_path 
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${firstPhoto.file_path}`
                : null

              return (
                <div key={favorite.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-lg transition-all">
                  {/* Photo */}
                  <Link href={`/models/${favorite.model.id}`} className="block relative aspect-[3/4] bg-gradient-to-br from-pink-100 to-rose-100">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt={modelDetails?.showname || favorite.model.username}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <User className="w-20 h-20 text-pink-300" />
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        removeFavorite(favorite.id)
                      }}
                      disabled={removing === favorite.id}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-500 text-red-500 hover:text-white rounded-full shadow-lg transition-all disabled:opacity-50"
                    >
                      {removing === favorite.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Heart className="w-5 h-5 fill-current" />
                      )}
                    </button>
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <Link href={`/models/${favorite.model.id}`}>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-pink-600 transition-colors">
                        {modelDetails?.showname || favorite.model.username}
                      </h3>
                    </Link>
                    
                    {modelDetails?.city && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 text-pink-600" />
                        <span>{modelDetails.city}</span>
                      </div>
                    )}

                    {modelDetails?.age && (
                      <div className="text-sm text-gray-500">
                        Age: {modelDetails.age}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Saved {new Date(favorite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
