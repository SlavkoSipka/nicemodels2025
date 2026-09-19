import Image from 'next/image'
import Link from 'next/link'
import { INLINE_LINK_RE, isOptimizableImage, isSafeHref, type CmsBlock } from '@/lib/cms'

const INTERNAL_ORIGIN = 'https://nicemodels.ch'

/**
 * Renders the CMS's inline [anchor](url) markup.
 *
 * React escapes text nodes, so the injection risk here is the href, not the
 * text: a javascript: URL would otherwise become a live link. Anything that is
 * not http(s) degrades to plain text.
 */
function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  let key = 0

  for (const match of text.matchAll(INLINE_LINK_RE)) {
    const [full, anchor, url] = match
    const start = match.index ?? 0

    if (start > last) parts.push(text.slice(last, start))

    if (isSafeHref(url)) {
      const internal = url.startsWith(INTERNAL_ORIGIN)
      parts.push(
        internal ? (
          <Link key={key++} href={url.slice(INTERNAL_ORIGIN.length)} className="text-rose-600 underline underline-offset-2 hover:text-rose-700">
            {anchor}
          </Link>
        ) : (
          <a key={key++} href={url} rel="nofollow noopener noreferrer" target="_blank" className="text-rose-600 underline underline-offset-2 hover:text-rose-700">
            {anchor}
          </a>
        )
      )
    } else {
      parts.push(anchor)
    }

    last = start + full.length
  }

  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

function Block({ block }: { block: CmsBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="mb-5 text-[1.05rem] leading-[1.75] text-gray-800">
          <RichText text={block.text ?? ''} />
        </p>
      )

    case 'heading': {
      if (block.level === 3) {
        return (
          <h3 className="mt-8 mb-3 text-xl font-semibold text-gray-900">{block.text}</h3>
        )
      }
      return (
        <h2 className="mt-10 mb-4 text-2xl font-bold text-gray-900">{block.text}</h2>
      )
    }

    case 'list':
      return (
        <ul className="mb-5 list-disc space-y-2 pl-6 text-[1.05rem] leading-[1.75] text-gray-800">
          {(block.items ?? []).map((item, i) => (
            <li key={i}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      )

    case 'table': {
      const headers = block.headers ?? []
      const rows = block.rows ?? []
      if (headers.length === 0 || rows.length === 0) return null
      return (
        <figure className="mb-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-900">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="border border-gray-200 px-3 py-2 align-top text-gray-800">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption ? (
            <figcaption className="mt-2 text-sm text-gray-500">{block.caption}</figcaption>
          ) : null}
        </figure>
      )
    }

    case 'image': {
      if (!block.url) return null
      // An editor-supplied host that next.config.ts doesn't know makes
      // next/image throw and 500s the whole article, so serve those plainly.
      const optimizable = isOptimizableImage(block.url)
      return (
        <figure className="mb-8">
          {optimizable ? (
            <Image
              src={block.url}
              alt={block.alt ?? ''}
              width={1200}
              height={675}
              className="w-full rounded-lg object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.url}
              alt={block.alt ?? ''}
              loading="lazy"
              className="w-full rounded-lg object-cover"
            />
          )}
          {block.caption ? (
            <figcaption className="mt-2 text-center text-sm text-gray-500">{block.caption}</figcaption>
          ) : null}
        </figure>
      )
    }

    case 'youtube': {
      if (!block.video_id) return null
      return (
        <div className="relative mb-8 w-full overflow-hidden rounded-lg pt-[56.25%]">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${block.video_id}`}
            title={block.caption ?? 'Video'}
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      )
    }

    case 'quote':
      return (
        <blockquote className="mb-8 rounded-r-lg border-l-4 border-gray-200 bg-gray-50 px-5 py-3">
          <p className="text-lg italic text-gray-800">{block.text}</p>
          {block.author ? (
            <cite className="mt-2 block text-sm not-italic text-gray-500">— {block.author}</cite>
          ) : null}
        </blockquote>
      )

    case 'divider':
      return <hr className="my-10 border-gray-200" />

    // A tweet embed needs a third-party script; the CMS only stores the URL, so
    // this stays a plain link rather than pulling in widgets.js.
    case 'twitter':
      return block.tweet_url && isSafeHref(block.tweet_url) ? (
        <p className="mb-5">
          <a href={block.tweet_url} rel="nofollow noopener noreferrer" target="_blank" className="text-rose-600 underline">
            {block.tweet_url}
          </a>
        </p>
      ) : null

    default:
      return null
  }
}

export default function ArticleBody({ blocks }: { blocks: CmsBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </>
  )
}
