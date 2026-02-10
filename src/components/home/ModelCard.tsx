'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Calendar, Sparkles } from 'lucide-react'
import { trackProfileView } from '@/lib/tracking'

interface ModelCardProps {
  model: {
    id: string
    username: string
    photoUrl?: string
    model_details: {
      showname: string
      city: string
      age: number
      ethnicity: string
      hair_color: string
    }
  }
  priority?: boolean
}

export default function ModelCard({ model, priority = false }: ModelCardProps) {
  const details = model.model_details

  const handleClick = () => {
    trackProfileView(model.id)
  }

  return (
    <Link href={`/models/${model.id}`} onClick={handleClick}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 group cursor-pointer border-2 border-transparent hover:border-pink-500">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-pink-100 to-rose-100">
          {model.photoUrl ? (
            <Image
              src={model.photoUrl}
              alt={details?.showname || model.username}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-pink-300" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* "NEW" Badge */}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            HOT
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
            {details?.showname || model.username}
          </h3>
          
          <div className="space-y-2">
            {details?.city && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-pink-500" />
                <span>{details.city}</span>
              </div>
            )}
            
            {details?.age && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-pink-500" />
                <span>{details.age} years</span>
              </div>
            )}
            
            {(details?.ethnicity || details?.hair_color) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {details?.ethnicity && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">
                    {details.ethnicity}
                  </span>
                )}
                {details?.hair_color && (
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">
                    {details.hair_color}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* View Profile Button */}
          <button className="mt-4 w-full py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:from-pink-600 hover:to-rose-700">
            View Profile
          </button>
        </div>
      </div>
    </Link>
  )
}
