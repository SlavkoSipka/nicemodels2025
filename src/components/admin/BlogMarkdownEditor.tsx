'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Eye,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Heading2,
  List,
  Image as ImageIcon,
  Youtube,
  Twitter,
  Quote,
  Minus,
  Upload,
} from 'lucide-react'
import {
  renderSimpleMarkdown,
  parseMarkdownToBlocks,
  serializeBlocksToMarkdown,
  extractYouTubeId,
  type MarkdownBlock,
} from '@/lib/markdown'

interface BlogMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
  label?: string
  required?: boolean
  /** Enables the upload button on image blocks. Returns the uploaded file's public URL. */
  onUploadImage?: (file: File) => Promise<string | null>
}

// Block-based blog editor (mirrors the ai-blog-cms post editor UX). Every
// block reads/writes the same markdown-lite syntax as lib/markdown.ts, so
// the serialized `value` stays a plain string — no DB schema change needed.

const BLOCK_TYPES: MarkdownBlock['type'][] = [
  'paragraph',
  'heading',
  'list',
  'image',
  'youtube',
  'twitter',
  'quote',
  'divider',
]

const TYPE_ICONS: Record<MarkdownBlock['type'], typeof Type> = {
  paragraph: Type,
  heading: Heading2,
  list: List,
  image: ImageIcon,
  youtube: Youtube,
  twitter: Twitter,
  quote: Quote,
  divider: Minus,
}

const TYPE_COLORS: Record<MarkdownBlock['type'], string> = {
  paragraph: 'bg-gray-100 text-gray-700',
  heading: 'bg-blue-100 text-blue-700',
  list: 'bg-purple-100 text-purple-700',
  image: 'bg-emerald-100 text-emerald-700',
  youtube: 'bg-red-100 text-red-700',
  twitter: 'bg-sky-100 text-sky-700',
  quote: 'bg-amber-100 text-amber-700',
  divider: 'bg-gray-100 text-gray-500',
}

function emptyBlock(type: MarkdownBlock['type']): MarkdownBlock {
  switch (type) {
    case 'paragraph': return { type: 'paragraph', text: '' }
    case 'heading': return { type: 'heading', text: '', level: 2 }
    case 'list': return { type: 'list', ordered: false, items: [''] }
    case 'image': return { type: 'image', url: '', alt: '', caption: '' }
    case 'youtube': return { type: 'youtube', url: '' }
    case 'twitter': return { type: 'twitter', url: '' }
    case 'quote': return { type: 'quote', text: '', author: '' }
    case 'divider': return { type: 'divider' }
  }
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className="w-full resize-none overflow-hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
    />
  )
}

function ImageBlockFields({
  block,
  onChange,
  onUploadImage,
  t,
}: {
  block: Extract<MarkdownBlock, { type: 'image' }>
  onChange: (updated: MarkdownBlock) => void
  onUploadImage?: (file: File) => Promise<string | null>
  t: (key: string, vars?: Record<string, string | number | Date>) => string
}) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File | null) => {
    if (!file || !onUploadImage) return
    setUploading(true)
    try {
      const url = await onUploadImage(file)
      if (url) onChange({ ...block, url })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {block.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.url}
          alt={block.alt || ''}
          className="max-h-48 w-full rounded-lg object-cover"
        />
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={block.url}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
          placeholder={t('imageUrlPlaceholder')}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand"
        />
        {onUploadImage && (
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? t('uploading') : t('uploadImage')}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>
      <input
        type="text"
        value={block.alt}
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
        placeholder={t('imageAltPlaceholder')}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        type="text"
        value={block.caption}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        placeholder={t('imageCaptionPlaceholder')}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  )
}

function BlockCard({
  block,
  index,
  total,
  typeLabel,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onUploadImage,
  t,
}: {
  block: MarkdownBlock
  index: number
  total: number
  typeLabel: string
  onChange: (updated: MarkdownBlock) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onUploadImage?: (file: File) => Promise<string | null>
  t: (key: string, vars?: Record<string, string | number | Date>) => string
}) {
  const Icon = TYPE_ICONS[block.type]

  const renderContent = () => {
    switch (block.type) {
      case 'paragraph':
        return (
          <AutoTextarea
            value={block.text}
            onChange={(v) => onChange({ ...block, text: v })}
            placeholder={t('paragraphPlaceholder')}
          />
        )

      case 'heading':
        return (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={block.text}
              onChange={(e) => onChange({ ...block, text: e.target.value })}
              placeholder={t('headingPlaceholder')}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              onClick={() => onChange({ ...block, level: block.level === 2 ? 3 : 2 })}
              title={block.level === 2 ? t('heading2') : t('heading3')}
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              {block.level === 2 ? 'H2' : 'H3'}
            </button>
          </div>
        )

      case 'list':
        return (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onChange({ ...block, ordered: !block.ordered })}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              {block.ordered ? t('numberedList') : t('bulletList')}
            </button>
            {block.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-right text-xs text-gray-400">
                  {block.ordered ? `${i + 1}.` : '•'}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const items = [...block.items]
                    items[i] = e.target.value
                    onChange({ ...block, items })
                  }}
                  placeholder={t('listItemPlaceholder', { n: i + 1 })}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={() => {
                    const items = block.items.filter((_, idx) => idx !== i)
                    onChange({ ...block, items: items.length ? items : [''] })
                  }}
                  title={t('removeItem')}
                  className="shrink-0 text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange({ ...block, items: [...block.items, ''] })}
              className="text-xs font-semibold text-brand hover:underline"
            >
              + {t('addItem')}
            </button>
          </div>
        )

      case 'image':
        return (
          <ImageBlockFields
            block={block}
            onChange={onChange}
            onUploadImage={onUploadImage}
            t={t}
          />
        )

      case 'youtube': {
        const id = extractYouTubeId(block.url)
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.url}
              onChange={(e) => onChange({ ...block, url: e.target.value })}
              placeholder={t('youtubeUrlPlaceholder')}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {id && (
              <div className="relative w-full overflow-hidden rounded-lg bg-gray-100 pt-[56.25%]">
                <iframe
                  src={`https://www.youtube.com/embed/${id}`}
                  className="absolute inset-0 h-full w-full rounded-lg"
                  allowFullScreen
                  title="YouTube preview"
                />
              </div>
            )}
          </div>
        )
      }

      case 'twitter':
        return (
          <input
            type="text"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder={t('twitterUrlPlaceholder')}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        )

      case 'quote':
        return (
          <div className="space-y-2">
            <AutoTextarea
              value={block.text}
              onChange={(v) => onChange({ ...block, text: v })}
              placeholder={t('quoteTextPlaceholder')}
            />
            <input
              type="text"
              value={block.author}
              onChange={(e) => onChange({ ...block, author: e.target.value })}
              placeholder={t('quoteAuthorPlaceholder')}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        )

      case 'divider':
        return <hr className="border-gray-300" />
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[block.type]}`}
        >
          <Icon className="h-3 w-3" /> {typeLabel}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            title={t('moveUp')}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title={t('moveDown')}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title={t('removeBlock')}
            className="ml-1 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="p-3">{renderContent()}</div>
    </div>
  )
}

// Blog-topic-only rich text input. Unlike the shared RichTextEditor (used for
// plain-text bios/listings rendered via htmlToPlainText), this one edits a
// list of typed blocks that serialize to markdown-lite syntax, which
// BlogTopicClient renders with renderSimpleMarkdown.
export default function BlogMarkdownEditor({
  value,
  onChange,
  placeholder,
  height = 300,
  label,
  required = false,
  onUploadImage,
}: BlogMarkdownEditorProps) {
  const t = useTranslations('components.richTextEditor')
  const ph = placeholder ?? t('defaultPlaceholder')
  const [preview, setPreview] = useState(false)

  const [blocks, setBlocks] = useState<MarkdownBlock[]>(() => parseMarkdownToBlocks(value))
  const [lastEmitted, setLastEmitted] = useState(value)

  // Resync when the parent resets `value` from outside (e.g. after submit
  // clears the create form, or a different topic is loaded into edit mode).
  // Done during render (not an effect) to avoid a cascading extra render.
  if (value !== lastEmitted) {
    setLastEmitted(value)
    setBlocks(parseMarkdownToBlocks(value))
  }

  const emit = (next: MarkdownBlock[]) => {
    setBlocks(next)
    const md = serializeBlocksToMarkdown(next)
    setLastEmitted(md)
    onChange(md)
  }

  const updateBlock = (index: number, updated: MarkdownBlock) =>
    emit(blocks.map((b, i) => (i === index ? updated : b)))

  const deleteBlock = (index: number) => emit(blocks.filter((_, i) => i !== index))

  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    emit(next)
  }

  const addBlock = (type: MarkdownBlock['type']) => emit([...blocks, emptyBlock(type)])

  const typeLabels: Record<MarkdownBlock['type'], string> = {
    paragraph: t('blockParagraph'),
    heading: t('blockHeading'),
    list: t('blockList'),
    image: t('blockImage'),
    youtube: t('blockYoutube'),
    twitter: t('blockTwitter'),
    quote: t('blockQuote'),
    divider: t('blockDivider'),
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        {label && (
          <label className="block text-xs font-bold text-gray-800">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {preview ? t('editTab') : t('previewTab')}
        </button>
      </div>

      {preview ? (
        <div
          className="w-full overflow-y-auto rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900"
          style={{ minHeight: height }}
          dangerouslySetInnerHTML={{
            __html:
              renderSimpleMarkdown(serializeBlocksToMarkdown(blocks)) ||
              `<p class="text-gray-400">${ph}</p>`,
          }}
        />
      ) : (
        <div
          className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2"
          style={{ minHeight: height }}
        >
          {blocks.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
              {t('noBlocksYet')}
            </div>
          )}
          {blocks.map((block, i) => (
            <BlockCard
              key={i}
              block={block}
              index={i}
              total={blocks.length}
              typeLabel={typeLabels[block.type]}
              onChange={(updated) => updateBlock(i, updated)}
              onDelete={() => deleteBlock(i)}
              onMoveUp={() => moveBlock(i, -1)}
              onMoveDown={() => moveBlock(i, 1)}
              onUploadImage={onUploadImage}
              t={t}
            />
          ))}
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white p-2.5">
            <span className="mr-1 self-center text-xs font-medium text-gray-500">
              {t('addBlock')}
            </span>
            {BLOCK_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type]
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-brand hover:bg-brand-light hover:text-brand-dark"
                >
                  <Icon className="h-3 w-3" /> {typeLabels[type]}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
