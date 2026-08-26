// Minimal self-contained markdown-lite engine for blog topic bodies.
// Supports: # / ## / ### headings, **bold**, *italic*, "- " bullet lists,
// "1. " numbered lists, "> " quotes (optional "> — Author" line), "---"
// dividers, "![alt](url "caption")" images, and bare YouTube/X/Twitter
// links on their own line (auto-embedded). Blank lines separate blocks,
// single newlines within a paragraph become <br/>.
// No external dependency — output is always built from escaped text.
//
// This file backs both the public renderer (renderSimpleMarkdown) and the
// admin block editor (parseMarkdownToBlocks / serializeBlocksToMarkdown) —
// both read the exact same syntax, so what you build in the editor is what
// renders on the site.

// ─── Block-editor model ───────────────────────────────────────────────────

export type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level: 2 | 3 }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image'; url: string; alt: string; caption: string }
  | { type: 'youtube'; url: string }
  | { type: 'twitter'; url: string }
  | { type: 'quote'; text: string; author: string }
  | { type: 'divider' }

// ─── Internal tokenizer (shared by render + block parsing) ────────────────

type Token =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'heading'; level: 2 | 3 | 4; text: string }
  | { kind: 'quote'; lines: string[]; author: string | null }
  | { kind: 'image'; url: string; alt: string; caption: string }
  | { kind: 'youtube'; url: string }
  | { kind: 'twitter'; url: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'divider' }

const YOUTUBE_LINE_RE = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=[\w-]{6,}|youtu\.be\/[\w-]{6,})\/?(\?[^\s]*)?$/i
const TWITTER_LINE_RE = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\s/]+\/status\/\d+\/?$/i
const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/

export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/)
  return match ? match[1] : null
}

function tokenize(text: string): Token[] {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n')
  const tokens: Token[] = []
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length) {
      tokens.push({ kind: 'paragraph', lines: paragraph })
      paragraph = []
    }
  }

  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trim()

    if (trimmed === '') {
      flushParagraph()
      i++
      continue
    }

    if (/^-{3,}$/.test(trimmed)) {
      flushParagraph()
      tokens.push({ kind: 'divider' })
      i++
      continue
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.*)/)
    if (heading) {
      flushParagraph()
      const level = (heading[1].length + 1) as 2 | 3 | 4
      tokens.push({ kind: 'heading', level, text: heading[2] })
      i++
      continue
    }

    const image = trimmed.match(IMAGE_LINE_RE)
    if (image) {
      flushParagraph()
      tokens.push({ kind: 'image', alt: image[1] || '', url: image[2], caption: image[3] || '' })
      i++
      continue
    }

    if (YOUTUBE_LINE_RE.test(trimmed)) {
      flushParagraph()
      tokens.push({ kind: 'youtube', url: trimmed })
      i++
      continue
    }

    if (TWITTER_LINE_RE.test(trimmed)) {
      flushParagraph()
      tokens.push({ kind: 'twitter', url: trimmed })
      i++
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      flushParagraph()
      const raw: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        raw.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      let author: string | null = null
      if (raw.length > 1) {
        const authorMatch = raw[raw.length - 1].match(/^[—-]\s*(.+)$/)
        if (authorMatch) {
          author = authorMatch[1]
          raw.pop()
        }
      }
      tokens.push({ kind: 'quote', lines: raw, author })
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph()
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i++
      }
      tokens.push({ kind: 'list', ordered: false, items })
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph()
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      tokens.push({ kind: 'list', ordered: true, items })
      continue
    }

    paragraph.push(trimmed)
    i++
  }
  flushParagraph()

  return tokens
}

// ─── HTML rendering (public site + editor preview) ────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inlineFormat(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')
}

function renderToken(token: Token): string {
  switch (token.kind) {
    case 'paragraph':
      return `<p>${token.lines.map(inlineFormat).join('<br/>')}</p>`

    case 'heading': {
      const tag = `h${token.level}`
      const cls =
        token.level === 2
          ? 'text-xl sm:text-2xl font-bold text-gray-900 mt-6 mb-2'
          : token.level === 3
            ? 'text-lg sm:text-xl font-bold text-gray-900 mt-5 mb-2'
            : 'text-base sm:text-lg font-bold text-gray-900 mt-4 mb-2'
      return `<${tag} class="${cls}">${inlineFormat(token.text)}</${tag}>`
    }

    case 'list': {
      const tag = token.ordered ? 'ol' : 'ul'
      const cls = token.ordered ? 'list-decimal pl-5 my-3 space-y-1' : 'list-disc pl-5 my-3 space-y-1'
      return `<${tag} class="${cls}">${token.items.map((i) => `<li>${inlineFormat(i)}</li>`).join('')}</${tag}>`
    }

    case 'quote': {
      const body = token.lines.map(inlineFormat).join('<br/>')
      const cite = token.author
        ? `<cite class="mt-2 block text-sm not-italic text-gray-500">— ${inlineFormat(token.author)}</cite>`
        : ''
      return `<blockquote class="my-4 border-l-4 border-brand pl-4 italic text-gray-700">${body}${cite}</blockquote>`
    }

    case 'divider':
      return '<hr class="my-6 border-gray-200" />'

    case 'image': {
      const caption = token.caption
        ? `<figcaption class="mt-2 text-center text-xs text-gray-400">${escapeHtml(token.caption)}</figcaption>`
        : ''
      return `<figure class="my-4"><img src="${escapeHtml(token.url)}" alt="${escapeHtml(token.alt)}" class="w-full rounded-lg object-cover" loading="lazy" />${caption}</figure>`
    }

    case 'youtube': {
      const id = extractYouTubeId(token.url)
      if (!id) return ''
      return `<div class="relative my-4 w-full overflow-hidden rounded-lg bg-gray-100 pt-[56.25%]"><iframe src="https://www.youtube.com/embed/${id}" class="absolute inset-0 h-full w-full" allowfullscreen loading="lazy" title="YouTube video"></iframe></div>`
    }

    case 'twitter':
      return `<a href="${escapeHtml(token.url)}" target="_blank" rel="noopener noreferrer" class="my-4 flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">🔗 View post on X / Twitter</a>`
  }
}

export function renderSimpleMarkdown(text: string): string {
  return tokenize(text).map(renderToken).filter(Boolean).join('\n')
}

// ─── Block editor: parse markdown -> blocks, serialize blocks -> markdown ─

function tokenToBlock(token: Token): MarkdownBlock {
  switch (token.kind) {
    case 'paragraph':
      return { type: 'paragraph', text: token.lines.join('\n') }
    case 'heading':
      return { type: 'heading', text: token.text, level: token.level <= 2 ? 2 : 3 }
    case 'list':
      return { type: 'list', ordered: token.ordered, items: token.items }
    case 'quote':
      return { type: 'quote', text: token.lines.join('\n'), author: token.author || '' }
    case 'divider':
      return { type: 'divider' }
    case 'image':
      return { type: 'image', url: token.url, alt: token.alt, caption: token.caption }
    case 'youtube':
      return { type: 'youtube', url: token.url }
    case 'twitter':
      return { type: 'twitter', url: token.url }
  }
}

export function parseMarkdownToBlocks(text: string): MarkdownBlock[] {
  return tokenize(text).map(tokenToBlock)
}

function blockToMarkdown(block: MarkdownBlock): string {
  switch (block.type) {
    case 'paragraph':
      return block.text
    case 'heading':
      return `${'#'.repeat(block.level - 1)} ${block.text}`
    case 'list':
      return block.items
        .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
        .join('\n')
    case 'quote': {
      const lines = block.text.split('\n').map((l) => `> ${l}`)
      if (block.author.trim()) lines.push(`> — ${block.author.trim()}`)
      return lines.join('\n')
    }
    case 'divider':
      return '---'
    case 'image':
      return block.caption
        ? `![${block.alt}](${block.url} "${block.caption}")`
        : `![${block.alt}](${block.url})`
    case 'youtube':
      return block.url
    case 'twitter':
      return block.url
  }
}

export function serializeBlocksToMarkdown(blocks: MarkdownBlock[]): string {
  return blocks
    .map(blockToMarkdown)
    .filter((s) => s.length > 0)
    .join('\n\n')
}

// ─── Plain-text excerpt for meta descriptions ──────────────────────────────
// Strips markdown syntax and HTML down to readable text.

export function stripMarkdownToText(text: string): string {
  return tokenize(text)
    .map((token) => {
      switch (token.kind) {
        case 'paragraph':
          return token.lines.join(' ')
        case 'heading':
          return token.text
        case 'quote':
          return token.lines.join(' ')
        case 'list':
          return token.items.join(' ')
        case 'image':
          return token.alt || token.caption || ''
        case 'youtube':
        case 'twitter':
        case 'divider':
          return ''
      }
    })
    .join(' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
