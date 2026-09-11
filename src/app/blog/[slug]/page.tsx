import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ArticleBody from '@/components/blog/ArticleBody'
import { buildBreadcrumbJsonLd } from '@/lib/seo'
import {
  excerptOf,
  getBlogPost,
  getBlogPosts,
  leadImageOf,
  blogUrl,
  BLOG_PATH,
  REVALIDATE_SECONDS,
} from '@/lib/cms'

export const revalidate = REVALIDATE_SECONDS

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getBlogPosts()
  return posts.map(post => ({ slug: post.slug as string }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return { title: 'Blog', robots: { index: false, follow: false } }
  }

  const url = blogUrl(slug)
  const title = post.seo_meta?.meta_title?.trim() || post.title
  const description = excerptOf(post, 155)
  const image = leadImageOf(post) ?? 'https://nicemodels.ch/logo.webp'

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { 'de-CH': url, 'x-default': url },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      siteName: 'NiceModels.ch',
      locale: 'de_CH',
      images: [{ url: image, alt: post.title }],
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: [image],
    },
  }
}

function formatDate(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogArticle({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) notFound()

  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: 'Startseite', path: '' },
    { name: 'Blog', path: BLOG_PATH },
    { name: post.title, path: `${BLOG_PATH}/${slug}` },
  ])

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href={BLOG_PATH} className="hover:text-rose-600">
            Blog
          </Link>
        </nav>

        <h1 className="mb-3 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
          {post.title}
        </h1>

        {post.published_at ? (
          <time dateTime={post.published_at} className="mb-8 block text-sm text-gray-400">
            {formatDate(post.published_at)}
          </time>
        ) : null}

        <ArticleBody blocks={post.content_json ?? []} />

        {(post.tags ?? []).length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-gray-100 pt-6">
            {(post.tags ?? []).map(tag => (
              <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {(post.sources ?? []).length > 0 ? (
          <section className="mt-8 border-t border-gray-100 pt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Quellen
            </h2>
            <ul className="space-y-1.5 text-sm">
              {(post.sources ?? []).map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    rel="nofollow noopener noreferrer"
                    target="_blank"
                    className="text-rose-600 underline underline-offset-2 hover:text-rose-700"
                  >
                    {source.publisher}
                  </a>
                  <span className="text-gray-500"> — {source.claim}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <Footer />

      {post.schema_markup ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(post.schema_markup) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
    </>
  )
}
