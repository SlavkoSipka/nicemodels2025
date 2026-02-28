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
      <div
        className="overflow-hidden flex flex-row w-full transition-all duration-200"
        style={{
          background: 'white',
          borderRadius: '6px',
          border: '1px solid #f0e6ea',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(190,24,93,0.05)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(190,24,93,0.08)'
          el.style.transform = 'translateY(-2px)'
          el.style.borderColor = '#F9A8D4'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 2px 12px rgba(190,24,93,0.05)'
          el.style.transform = 'translateY(0)'
          el.style.borderColor = '#f0e6ea'
        }}
      >
        {/* Image - left */}
        <div className="relative w-[38%] min-w-[140px] flex-shrink-0 aspect-[3/4] overflow-hidden" style={{ background: '#f9f0f3' }}>
          {model.photoUrl ? (
            <Image
              src={model.photoUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 42vw, 22vw"
              priority={priority}
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Content - right */}
        <div className="flex-1 px-4 py-3 flex flex-col gap-1.5 min-w-0 self-stretch bg-white">

          {/* PREMIUM + time */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold tracking-wide" style={{ color: '#EC4899' }}>
              PREMIUM
            </span>
            {ago && (
              <span className="text-xs text-gray-400 whitespace-nowrap">{ago}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-snug line-clamp-3 group-hover:text-brand transition-colors">
            {title}
          </h3>

          {/* Description */}
          {description ? (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-4 flex-1">
              {description}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-sm font-medium"
                  style={{ color: '#2563eb' }}
                >
                  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="#3b82f6">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                  </svg>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="flex items-center gap-1 text-sm mt-0.5">
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
              <span className="truncate font-medium" style={{ color: '#2563eb' }}>{location}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
