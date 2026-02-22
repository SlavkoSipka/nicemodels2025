'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface Model {
  id: string
  username: string
  photoUrl?: string
  model_details?: { showname?: string }
}

interface StoryStripProps {
  models: Model[]
}

export default function StoryStrip({ models }: StoryStripProps) {
  const displayModels = models.slice(0, 12)

  if (displayModels.length === 0) return null

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-6 overflow-x-auto pb-2">
          {displayModels.map((model) => {
            const name = model.model_details?.showname || model.username
            const displayName = name.length > 12 ? `${name.slice(0, 10)}…` : name
            return (
              <Link
                key={model.id}
                href={`/models/${model.id}`}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
              >
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-pink-400 ring-2 ring-pink-200 group-hover:ring-pink-400 transition-all">
                  {model.photoUrl ? (
                    <Image
                      src={model.photoUrl}
                      alt={name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-pink-500" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700 text-center max-w-[72px] truncate group-hover:text-pink-600 transition-colors">
                  {displayName}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
