'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ChatModel {
  id: string
  model_name: string
  city: string | null
  model_photo: string | null
}

export default function AvailableForChat({ models }: { models: ChatModel[] }) {
  const router = useRouter()
  const t = useTranslations('components.home.availableForChat')
  // Read auth from the shared context instead of an extra auth.getUser() round-trip.
  const { user } = useAuth()
  const isLoggedIn = !!user
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      setOnlineIds(new Set())
      return
    }
    const supabase = createClient()
    const channel: RealtimeChannel = supabase.channel('online-users')

    function syncOnline(presenceState: Record<string, unknown[]>) {
      const ids = new Set<string>(
        Object.values(presenceState)
          .flat()
          .map((p: unknown) => (p as { user_id?: string }).user_id)
          .filter(Boolean) as string[],
      )
      setOnlineIds(ids)
    }

    channel
      .on('presence', { event: 'sync' }, () => syncOnline(channel.presenceState()))
      .on('presence', { event: 'join' }, () => syncOnline(channel.presenceState()))
      .on('presence', { event: 'leave' }, () => syncOnline(channel.presenceState()))
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const visibleModels = useMemo(
    () => models.filter(m => onlineIds.has(m.id)),
    [models, onlineIds]
  )

  if (visibleModels.length === 0) return null

  function handleViewAllChats() {
    if (!isLoggedIn) { router.push('/login'); return }
    window.dispatchEvent(new CustomEvent('open-chat-widget', { detail: { tab: 'online' } }))
  }

  function handleModelClick(model: ChatModel) {
    if (!isLoggedIn) { router.push('/login'); return }
    window.dispatchEvent(new CustomEvent('open-chat-with-model', {
      detail: { modelId: model.id, modelName: model.model_name, modelPhoto: model.model_photo },
    }))
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
    >
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{t('title')}</p>
        </div>
      </div>

      {/* Models list */}
      <div className="divide-y divide-gray-50">
        {visibleModels.map(model => (
          <button
            key={model.id}
            onClick={() => handleModelClick(model)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/70 transition-colors text-left group"
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100">
                {model.model_photo ? (
                  <Image
                    src={model.model_photo}
                    alt={model.model_name}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-pink-500 text-white font-bold text-sm">
                    {model.model_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 group-hover:text-pink-500 transition-colors truncate">
                {model.model_name}
              </p>
              {model.city && (
                <p className="text-[11px] text-gray-400 truncate">{model.city}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5" style={{ borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={handleViewAllChats}
          className="w-full py-2 rounded-lg text-center text-xs font-bold transition-all text-white hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #be185d, #ec4899)' }}
        >
          {t('viewAll')}
        </button>
      </div>
    </div>
  )
}
