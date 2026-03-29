import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { MessageSquare, Pin } from 'lucide-react'

function excerptFromHtml(html: string, n = 180): string {
  const t = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n)}…` : t
}

export default async function BlogPage() {
  const supabase = await createClient()

  const { data: topics, error: topicsErr } = await supabase
    .from('discussion_topics')
    .select('id, slug, title, body, is_pinned, updated_at, created_at')
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{ background: '#fce9f3' }}>
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="max-w-7xl mx-auto px-3 py-6 sm:px-4 sm:py-12">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 sm:mb-3">
              Community
            </p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight max-w-2xl">
              Discussions
            </h1>
            <p className="mt-2 sm:mt-3 text-slate-500 text-base sm:text-lg max-w-xl">
              Open topics from the team. Sign in to reply and join the thread.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-10">
          {list.length === 0 ? (
            <div
              className="rounded-xl border border-gray-200 bg-white px-6 py-14 text-center"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No open topics yet.</p>
              <p className="text-sm text-slate-400 mt-1">Check back soon for new discussions.</p>
            </div>
          ) : (
            <ul className="space-y-3 sm:space-y-4">
              {list.map(topic => (
                <li key={topic.id}>
                  <Link
                    href={`/blog/${topic.slug}`}
                    className="group block rounded-xl border border-sky-100 bg-white p-4 sm:p-5 shadow-sm hover:border-pink-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {topic.is_pinned && (
                        <Pin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden />
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-pink-600 transition-colors leading-snug">
                          {topic.title}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {excerptFromHtml(topic.body || '')}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {countMap.get(topic.id) || 0}{' '}
                            {(countMap.get(topic.id) || 0) === 1 ? 'reply' : 'replies'}
                          </span>
                          <span>
                            Updated{' '}
                            {new Date(topic.updated_at).toLocaleDateString(undefined, {
                              dateStyle: 'medium',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
