'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Heart, Search, Loader2, MapPin, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface FavoriteModel {
  id: string
  created_at: string
  model: {
    id: string
    username: string
    email: string
    model_details: { showname: string; city: string; age: number }[]
    model_photos: { file_path: string }[]
  }
}

export default function UserFavorites() {
  const t = useTranslations('dashboard.user.favorites')
  const [favorites, setFavorites] = useState<FavoriteModel[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => { loadFavorites() }, [])

  const loadFavorites = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: favoritesData } = await supabase
      .from('favorites').select('id, created_at, model_id').eq('user_id', user.id).order('created_at', { ascending: false })

    if (!favoritesData || favoritesData.length === 0) { setLoading(false); return }

    const modelIds = favoritesData.map(f => f.model_id)
    const [{ data: profilesData }, { data: detailsData }, { data: photosData }] = await Promise.all([
      supabase.from('profiles').select('id, username, email').in('id', modelIds),
      supabase.from('model_details').select('model_id, showname, city, age').in('model_id', modelIds),
      supabase.from('model_photos').select('model_id, file_path').in('model_id', modelIds).eq('is_approved', true).order('uploaded_at', { ascending: false }),
    ])

    const combined = favoritesData.map(fav => ({
      id: fav.id,
      created_at: fav.created_at,
      model: {
        id: fav.model_id,
        username: profilesData?.find(p => p.id === fav.model_id)?.username || '',
        email: profilesData?.find(p => p.id === fav.model_id)?.email || '',
        model_details: detailsData?.filter(d => d.model_id === fav.model_id) || [],
        model_photos: photosData?.filter(p => p.model_id === fav.model_id) || [],
      }
    }))

    setFavorites(combined as any)
    setLoading(false)
  }

  const removeFavorite = async (favoriteId: string) => {
    setRemoving(favoriteId)
    const supabase = createClient()
    const { error } = await supabase.from('favorites').delete().eq('id', favoriteId)
    if (!error) setFavorites(favorites.filter(f => f.id !== favoriteId))
    setRemoving(null)
  }

  if (loading) return null

  return (
    <div className="ml-0 md:ml-[280px] min-h-screen bg-gray-50">
      <div className="py-4 md:py-6 px-4 md:px-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-xs text-gray-500">
                {favorites.length > 0
                  ? favorites.length === 1
                    ? t('subtitleOne', { count: favorites.length })
                    : t('subtitleMany', { count: favorites.length })
                  : t('subtitleEmpty')}
              </p>
            </div>
          </div>

          {favorites.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1">{t('noTitle')}</h2>
              <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                {t('noBody')}
              </p>
              <Link href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover">
                <Search className="w-4 h-4" />
                {t('browseModels')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favorites.map((favorite) => {
                const details = favorite.model?.model_details?.[0]
                const firstPhoto = favorite.model?.model_photos?.[0]
                const photoUrl = firstPhoto?.file_path
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${firstPhoto.file_path}`
                  : null

                return (
                  <div key={favorite.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden group hover:border-gray-300 hover:shadow-sm transition-all">
                    <Link href={`/models/${favorite.model.id}`} className="block relative aspect-[3/4] bg-gray-100">
                      {photoUrl ? (
                        <Image src={photoUrl} alt={details?.showname || favorite.model.username}
                          fill sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <User className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      <button onClick={e => { e.preventDefault(); removeFavorite(favorite.id) }}
                        disabled={removing === favorite.id}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-red-500 rounded-full shadow transition-colors disabled:opacity-50">
                        {removing === favorite.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Heart className="w-4 h-4 fill-current" />}
                      </button>
                    </Link>
                    <div className="p-3">
                      <Link href={`/models/${favorite.model.id}`}>
                        <p className="text-sm font-bold text-gray-900 hover:text-brand truncate">
                          {details?.showname || favorite.model.username}
                        </p>
                      </Link>
                      {details?.city && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{details.city}</span>
                        </div>
                      )}
                      {details?.age && <p className="text-xs text-gray-400 mt-0.5">{t('ageLabel', { age: details.age })}</p>}
                      <p className="text-xs text-gray-400 mt-1 border-t border-gray-100 pt-1">
                        {t('savedAt', { date: new Date(favorite.created_at).toLocaleDateString() })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
