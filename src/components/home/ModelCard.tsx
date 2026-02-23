'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Sparkles } from 'lucide-react'
import { trackProfileView } from '@/lib/tracking'

interface ModelCardProps {
  model: {
    id: string
    username: string
    created_at?: string
    photoUrl?: string
    model_details: {
      showname: string
      city: string
      age: number
      ethnicity: string
      hair_color: string
      about_me?: string
      services_for?: string[]
    }
  }
  priority?: boolean
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `vor ${diff} Sekunden`
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Minute${Math.floor(diff / 60) === 1 ? '' : 'n'}`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Stunde${Math.floor(diff / 3600) === 1 ? '' : 'n'}`
  return `vor ${Math.floor(diff / 86400)} Tag${Math.floor(diff / 86400) === 1 ? '' : 'en'}`
}

export default function ModelCard({ model, priority = false }: ModelCardProps) {
  const details = model.model_details

  const handleClick = () => {
    trackProfileView(model.id)
  }

  const title = details?.showname || model.username
  const city = details?.city || ''
  const age = details?.age ? `${details.age} years` : ''
  const location = [city, age].filter(Boolean).join(', ')
  const tags = details?.services_for?.length ? details.services_for : []
  const description = details?.about_me || ''
  const ago = timeAgo(model.created_at)

  return (
    <Link href={`/models/${model.id}`} onClick={handleClick} className="block group w-full">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl hover:border-brand/40 transition-all duration-200 flex flex-row w-full">

        {/* Slika - levo, aspect 3:4 */}
        <div className="relative w-[40%] min-w-[150px] flex-shrink-0 aspect-[3/4] bg-gray-100">
          {model.photoUrl ? (
            <Image
              src={model.photoUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 45vw, 25vw"
              priority={priority}
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Sadržaj - desno */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col gap-2 min-w-0 self-stretch">

          {/* PREMIUM + vreme */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              PREMIUM
            </span>
            {ago && (
              <span className="text-xs text-gray-400 whitespace-nowrap">{ago}</span>
            )}
          </div>

          {/* Ime */}
          <h3 className="font-bold text-gray-900 text-lg sm:text-xl leading-tight line-clamp-2 group-hover:text-brand transition-colors">
            {title}
          </h3>

          {/* Opis - popunjava slobodan prostor */}
          {description ? (
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-5 flex-1">
              {description}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          {/* Tagovi (usluge) */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium"
                >
                  <svg className="w-3 h-3 fill-blue-500 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Lokacija */}
          {location && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="truncate font-medium">{location}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
