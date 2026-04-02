import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BlogTopicClient, { type TopicPayload } from '../BlogTopicClient'
import { resolveAuthorLabels } from '@/lib/discussion/resolveAuthors'
import type { DiscussionPostNode } from '@/lib/discussion/tree'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: topic } = await supabase
    .from('discussion_topics')
    .select('title, status')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (!topic) {
    return { title: 'Discussion | NiceModels' }
  }

  return {
    title: `${topic.title} – Discussion | NiceModels`,
    description: `Community discussion: ${topic.title}`,
    alternates: { canonical: `https://www.nicemodels.ch/blog/${slug}` },
  }
}

export default async function BlogTopicPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: row, error: topicErr } = await supabase
    .from('discussion_topics')
    .select('id, slug, title, body, cover_image, created_at, updated_at, status')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (topicErr || !row) {
    notFound()
  }

  const topic: TopicPayload = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body || '',
    cover_image: row.cover_image || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  const [{ data: posts }, { data: { user } }] = await Promise.all([
    supabase
      .from('discussion_posts')
      .select('id, topic_id, parent_id, author_id, body, created_at, updated_at')
      .eq('topic_id', topic.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ])

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    isAdmin = profile?.role === 'admin'
  }

  const authorIds = (posts || []).map(p => p.author_id)
  const labelMap = await resolveAuthorLabels(supabase, authorIds)

  const flatPosts: Omit<DiscussionPostNode, 'children'>[] = (posts || []).map(p => ({
    id: p.id,
    topic_id: p.topic_id,
    parent_id: p.parent_id,
    author_id: p.author_id,
    body: p.body,
    created_at: p.created_at,
    updated_at: p.updated_at,
    author_label: labelMap.get(p.author_id) || 'Member',
  }))

  return (
    <>
      <Navbar />
      <BlogTopicClient topic={topic} flatPosts={flatPosts} isAdmin={isAdmin} />
      <Footer />
    </>
  )
}
