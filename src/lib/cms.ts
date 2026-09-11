/**
 * Reads articles from the AI Blog CMS.
 *
 * The CMS is a separate service with its own database; everything here goes
 * through its public read API, which needs no key. Articles are German (de-CH)
 * only for now, because the site resolves locale from a cookie rather than the
 * URL, so a second language would have no distinct URL to be indexed at.
 */

const CMS_URL = process.env.CMS_BASE_URL ?? ''
const SITE_ID = process.env.CMS_SITE_ID ?? ''

export const MAGAZINE_PATH = '/magazine'
export const REVALIDATE_SECONDS = 300

export interface CmsBlock {
  type:
    | 'paragraph'
    | 'heading'
    | 'list'
    | 'image'
    | 'youtube'
    | 'twitter'
    | 'quote'
    | 'divider'
    | 'table'
  text?: string
  level?: 2 | 3
  items?: string[]
  url?: string | null
  alt?: string
  caption?: string
  video_id?: string | null
  tweet_url?: string | null
  author?: string
  headers?: string[]
  rows?: string[][]
}

export interface CmsPost {
  id: string
  title: string
  slug: string | null
  content_json: CmsBlock[] | null
  seo_meta: { meta_title?: string; meta_description?: string } | null
  schema_markup: Record<string, unknown> | null
  og_data: Record<string, string | null> | null
  tags: string[] | null
  sources: { claim: string; url: string; publisher: string }[] | null
  missing_inputs: string[] | null
  published_at: string | null
  created_at: string
}

async function fetchPosts(): Promise<CmsPost[]> {
  if (!CMS_URL || !SITE_ID) return []

  try {
    const res = await fetch(`${CMS_URL}/api/sites/${SITE_ID}/posts`, {
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) {
      console.error('[cms] posts fetch failed:', res.status)
      return []
    }
    const data = (await res.json()) as { posts?: CmsPost[] }
    // A post with no slug has no URL to live at, so it cannot be rendered.
    return (data.posts ?? []).filter(p => p.slug)
  } catch (err) {
    console.error('[cms] posts fetch error:', err)
    return []
  }
}

export async function getMagazinePosts(): Promise<CmsPost[]> {
  return fetchPosts()
}

export async function getMagazinePost(slug: string): Promise<CmsPost | null> {
  const posts = await fetchPosts()
  return posts.find(p => p.slug === slug) ?? null
}

export function magazineUrl(slug: string): string {
  return `https://nicemodels.ch${MAGAZINE_PATH}/${slug}`
}

/** Only http(s) may become a live link; the CMS allows inline [text](url). */
export function isSafeHref(url: string): boolean {
  try {
    const scheme = new URL(url).protocol.toLowerCase()
    return scheme === 'http:' || scheme === 'https:'
  } catch {
    return false
  }
}

export const INLINE_LINK_RE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g

/** Plain text with the link markup removed, for excerpts and descriptions. */
export function stripInlineLinks(text: string): string {
  return text.replace(INLINE_LINK_RE, '$1')
}

export function excerptOf(post: CmsPost, max = 180): string {
  const fromMeta = post.seo_meta?.meta_description?.trim()
  if (fromMeta) return fromMeta

  const firstParagraph = (post.content_json ?? []).find(b => b.type === 'paragraph')
  const text = stripInlineLinks(firstParagraph?.text ?? '')
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text
}

export function leadImageOf(post: CmsPost): string | null {
  const withUrl = (post.content_json ?? []).find(b => b.type === 'image' && b.url)
  return withUrl?.url ?? null
}
