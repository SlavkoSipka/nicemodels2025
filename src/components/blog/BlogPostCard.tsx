import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Newspaper } from 'lucide-react'
import {
  BLOG_PATH,
  excerptOf,
  isOptimizableImage,
  leadImageOf,
  type CmsPost,
} from '@/lib/cms'

/**
 * Deterministic gradient per post, so a card without a lead image still reads
 * as a designed card rather than an empty box — and keeps the same colours
 * between server render and hydration.
 *
 * Every article in the CMS is text-only today, so this is the normal case,
 * not an edge case.
 */
const GRADIENTS = [
  'from-rose-400 via-pink-400 to-fuchsia-400',
  'from-violet-400 via-purple-400 to-fuchsia-400',
  'from-sky-400 via-indigo-400 to-blue-400',
  'from-amber-400 via-orange-400 to-rose-400',
  'from-emerald-400 via-teal-400 to-cyan-400',
]

function gradientFor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return GRADIENTS[hash % GRADIENTS.length]
}

function formatDate(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function BlogPostCard({ post }: { post: CmsPost }) {
  const image = leadImageOf(post)
  const tags = (post.tags ?? []).slice(0, 2)
  const excerpt = excerptOf(post, 130)

  return (
    <article className="h-full">
      <Link
        href={`${BLOG_PATH}/${post.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg"
      >
        {/* Cover */}
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-slate-100">
          {image ? (
            isOptimizableImage(image) ? (
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(post.slug ?? post.id)}`}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
                aria-hidden
              />
              <Newspaper className="relative h-8 w-8 text-white/80" aria-hidden />
            </div>
          )}

          {tags.length > 0 ? (
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-700 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          {post.published_at ? (
            <time
              dateTime={post.published_at}
              className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400"
            >
              {formatDate(post.published_at)}
            </time>
          ) : null}

          <h2 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-brand">
            {post.title}
          </h2>

          {excerpt ? (
            <p className="mb-3 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
              {excerpt}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
            Weiterlesen
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </article>
  )
}
