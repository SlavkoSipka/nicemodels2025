'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DiscussionThread from '@/components/discussion/DiscussionThread'
import ReplyForm from '@/components/discussion/ReplyForm'
import { buildPostTree } from '@/lib/discussion/tree'
import type { DiscussionPostNode } from '@/lib/discussion/tree'

export interface TopicPayload {
  id: string
  slug: string
  title: string
  body: string
  created_at: string
  updated_at: string
}

export default function BlogTopicClient({
  topic,
  flatPosts,
}: {
  topic: TopicPayload
  flatPosts: Omit<DiscussionPostNode, 'children'>[]
}) {
  const router = useRouter()
  const nodes = buildPostTree(flatPosts)
  const refresh = () => router.refresh()

  return (
    <div className="min-h-screen" style={{ background: '#fce9f3' }}>
      <div className="max-w-3xl mx-auto px-3 py-6 sm:px-4 sm:py-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-pink-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All topics
        </Link>

        <article>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-2">
            {topic.title}
          </h1>
          <p className="text-xs text-slate-400 mb-6">
            Updated{' '}
            {new Date(topic.updated_at).toLocaleDateString(undefined, {
              dateStyle: 'medium',
            })}
          </p>
          <div
            className="prose prose-sm sm:prose-base max-w-none text-slate-700 prose-headings:text-slate-900 prose-a:text-pink-600 mb-10 pb-10 border-b border-gray-200"
            dangerouslySetInnerHTML={{ __html: topic.body }}
          />
        </article>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Discussion</h2>
          {nodes.length === 0 ? (
            <p className="text-sm text-slate-500 mb-6">No replies yet. Be the first to comment.</p>
          ) : (
            <div className="mb-8">
              <DiscussionThread topicId={topic.id} nodes={nodes} onPosted={refresh} />
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Add a reply</h3>
            <ReplyForm topicId={topic.id} parentId={null} onSuccess={refresh} />
          </div>
        </section>
      </div>
    </div>
  )
}
