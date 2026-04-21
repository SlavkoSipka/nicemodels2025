/** URL-safe slug from title; empty input yields "topic". */
export function slugifyTitle(title: string): string {
  const s = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return s || 'topic'
}

export function uniqueSlug(base: string): string {
  const suffix = crypto.randomUUID().slice(0, 8)
  const trimmed = base.slice(0, 72)
  return `${trimmed}-${suffix}`
}
