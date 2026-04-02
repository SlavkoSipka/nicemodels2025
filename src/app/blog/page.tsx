import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { MessageSquare, Pin } from 'lucide-react'

function excerptFromHtml(html: string, n = 180): string {
  const t = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n)}...` : t
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default async function BlogPage() {
  const supabase = await createClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  const { data: topics, error: topicsErr } = await supabase
    .from('discussion_topics')
    .select('id, slug, title, body, cover_image, is_pinned, updated_at, created_at')
    .eq('status', 'active')
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  const list = topicsErr ? [] : topics || []
  const topicIds = list.map(t => t.id)

  const countMap = new Map<string, number>()
  if (topicIds.length > 0) {
    const { data: countRows, error: countErr } = await supabase
      .from('discussion_posts')
      .select('topic_id')
      .in('topic_id', topicIds)
      .eq('is_deleted', false)

    if (!countErr) {
      for (const r of countRows || []) {
        countMap.set(r.topic_id, (countMap.get(r.topic_id) || 0) + 1)
      }
    }
  }

  const coverUrl = (path: string | null) =>
    path ? `${supabaseUrl}/storage/v1/object/public/discussion-images/${path}` : null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 sm:py-14">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Community
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Discussions
            </h1>
            <p className="mt-2 text-gray-500 text-base sm:text-lg max-w-xl">
              Open topics from the team. Sign in to reply and join the conversation.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {list.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No open topics yet.</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon for new discussions.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {list.map(topic => {
                const imgUrl = coverUrl(topic.cover_image)
                const replyCount = countMap.get(topic.id) || 0

                return (
                  <li key={topic.id}>
                    <Link
                      href={`/blog/${topic.slug}`}
                      className="group block rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-pink-200 transition-all overflow-hidden"
                    >
                      <div className="flex">
                        {imgUrl && (
                          <div className="relative w-28 sm:w-40 shrink-0 bg-gray-100">
                            <Image
                              src={imgUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="160px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 p-4 sm:p-5">
                          <div className="flex items-start gap-2">
                            {topic.is_pinned && (
                              <Pin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden />
                            )}
                            <div className="flex-1 min-w-0">
                              <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors leading-snug">
                                {topic.title}
                              </h2>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {excerptFromHtml(topic.body || '')}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                                <span className="inline-flex items-center gap-1">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                                </span>
                                <span>{timeAgo(topic.updated_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
