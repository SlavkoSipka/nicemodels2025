'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import DiscussionThread from '@/components/discussion/DiscussionThread'
import ReplyForm from '@/components/discussion/ReplyForm'
import { buildPostTree } from '@/lib/discussion/tree'
import type { DiscussionPostNode } from '@/lib/discussion/tree'

export interface TopicPayload {
  id: string
  slug: string
  title: string
  body: string
  cover_image: string | null
  created_at: string
  updated_at: string
}

function timeAgo(dateStr: string, t: (k: string, vars?: any) => string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return t('justNow')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return t('minutesAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days < 30) return t('daysAgo', { n: days })
  return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default function BlogTopicClient({
  topic,
  flatPosts,
  isAdmin = false,
}: {
  topic: TopicPayload
  flatPosts: Omit<DiscussionPostNode, 'children'>[]
  isAdmin?: boolean
}) {
  const router = useRouter()
  const t = useTranslations('publicPages.blog')
  const nodes = buildPostTree(flatPosts)
  const refresh = () => router.refresh()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const heroUrl = topic.cover_image
    ? `${supabaseUrl}/storage/v1/object/public/discussion-images/${topic.cover_image}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {heroUrl && (
        <div className="relative w-full h-48 sm:h-64 md:h-80 bg-gray-200 overflow-hidden">
          <Image
            src={heroUrl}
            alt={topic.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className={heroUrl ? '-mt-16 relative z-10' : 'pt-8'}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-5 sm:px-8 sm:py-7">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-pink-600 transition-colors mb-5"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('allDiscussions')}
              </Link>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight tracking-tight">
                {topic.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                <span>{t('posted', { time: timeAgo(topic.created_at, t) })}</span>
                {topic.updated_at !== topic.created_at && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>{t('updated', { time: timeAgo(topic.updated_at, t) })}</span>
                  </>
                )}
                <span className="text-gray-300">·</span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {t('replies', { count: flatPosts.length })}
                </span>
              </div>

              {topic.body && (
                <div
                  className="mt-6 prose prose-sm sm:prose-base max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-pink-600 prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: topic.body }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 mb-12">
          <div className="flex items-center gap-2 mb-5">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">
              {t('discussion')}
              {flatPosts.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({flatPosts.length})
                </span>
              )}
            </h2>
          </div>

          {nodes.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
              <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{t('noRepliesYet')}</p>
            </div>
          ) : (
            <div className="mb-6">
              <DiscussionThread topicId={topic.id} nodes={nodes} onPosted={refresh} isAdmin={isAdmin} />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3">{t('leaveReply')}</h3>
            <ReplyForm topicId={topic.id} parentId={null} onSuccess={refresh} />
          </div>
        </div>
      </div>
    </div>
  )
}
