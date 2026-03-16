'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { StatusMessage } from './HomePageClient'

const PER_PAGE = 6

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function LatestStatusMessages({ messages }: { messages: StatusMessage[] }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(messages.length / PER_PAGE)
  const visible = messages.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  if (messages.length === 0) return null

  return (
    <div>
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>Latest status messages</p>
        </div>

        {/* Messages */}
        <div className="divide-y divide-gray-50">
          {visible.map(msg => (
            <Link
              key={msg.id}
              href={`/models/${msg.model_id}`}
              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/70 transition-colors group"
            >
              {/* Avatar */}
              <div className="w-[48px] h-[48px] rounded-lg overflow-hidden shrink-0 bg-gray-100">
                {msg.model_photo ? (
                  <Image
                    src={msg.model_photo}
                    alt={msg.model_name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-pink-500 text-white font-bold text-lg">
                    {msg.model_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-gray-800 group-hover:text-pink-500 transition-colors truncate">
                    {msg.model_name}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                    {formatTimeAgo(msg.created_at)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {msg.caption}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-center gap-1 px-4 py-2.5"
            style={{ borderTop: '1px solid #f1f5f9' }}
          >
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors"
                style={{
                  background: page === i ? '#fce7f3' : 'transparent',
                  color: page === i ? '#be185d' : '#94a3b8',
                }}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
