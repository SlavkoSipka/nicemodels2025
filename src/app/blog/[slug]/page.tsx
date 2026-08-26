import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BlogTopicClient, { type TopicPayload } from '../BlogTopicClient'
import { resolveAuthorLabels } from '@/lib/discussion/resolveAuthors'
import type { DiscussionPostNode } from '@/lib/discussion/tree'
import { stripMarkdownToText } from '@/lib/markdown'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: topic } = await supabase
    .from('discussion_topics')
    .select('title, body, cover_image, status, created_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (!topic) {
    return { title: 'Diskussion', robots: { index: false, follow: false } }
  }

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const desc =
    stripMarkdownToText(topic.body || '').slice(0, 155)
    || `Community discussion: ${topic.title}`
  const ogImage = topic.cover_image
    ? `${SUPA_URL}/storage/v1/object/public/discussion-images/${topic.cover_image}`
    : 'https://nicemodels.ch/logo.webp'

  return {
    title: `${topic.title} – Diskussion`,
    description: desc,
    openGraph: {
      title: topic.title,
      description: desc,
      type: 'article',
      url: `https://nicemodels.ch/blog/${slug}`,
      images: [{ url: ogImage, alt: topic.title }],
      ...(topic.created_at ? { publishedTime: topic.created_at } : {}),
      ...(topic.updated_at ? { modifiedTime: topic.updated_at } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: topic.title,
      description: desc,
      images: [ogImage],
    },
    alternates: { canonical: `https://nicemodels.ch/blog/${slug}` },
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
  const tBlog = await getTranslations('publicPages.blog')

  const flatPosts: Omit<DiscussionPostNode, 'children'>[] = (posts || []).map(p => ({
    id: p.id,
    topic_id: p.topic_id,
    parent_id: p.parent_id,
    author_id: p.author_id,
    body: p.body,
    created_at: p.created_at,
    updated_at: p.updated_at,
    author_label: labelMap.get(p.author_id) || tBlog('memberFallback'),
  }))

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: topic.title,
    url: `https://nicemodels.ch/blog/${slug}`,
    datePublished: topic.created_at,
    dateModified: topic.updated_at || topic.created_at,
    ...(topic.cover_image
      ? { image: `${SUPA_URL}/storage/v1/object/public/discussion-images/${topic.cover_image}` }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: 'NiceModels.ch',
      url: 'https://nicemodels.ch',
      logo: { '@type': 'ImageObject', url: 'https://nicemodels.ch/logo.webp' },
    },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: flatPosts.length,
    },
  }

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogTopicClient topic={topic} flatPosts={flatPosts} isAdmin={isAdmin} />
      <Footer />
    </>
  )
}
