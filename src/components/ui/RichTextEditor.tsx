'use client'

import { useMemo, useRef } from 'react'
import { Editor } from '@tinymce/tinymce-react'

function getTinyCloudApiKey(): string | undefined {
  const k =
    process.env.NEXT_PUBLIC_TINYMCE_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TINYCLOUD_API_KEY?.trim()
  return k || undefined
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  height?: number
  label?: string
  required?: boolean
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  maxLength,
  height = 300,
  label,
  required = false,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null)
  const cloudApiKey = useMemo(() => getTinyCloudApiKey(), [])
  const selfHosted = !cloudApiKey

  const charCount = value ? value.replace(/<[^>]*>/g, '').length : 0

  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-gray-800 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <Editor
        apiKey={cloudApiKey}
        tinymceScriptSrc={selfHosted ? '/tinymce/tinymce.min.js' : undefined}
        licenseKey={selfHosted ? 'gpl' : undefined}
        onInit={(_evt, editor) => { editorRef.current = editor }}
        value={value}
        onEditorChange={(content) => {
          if (maxLength) {
            const textOnly = content.replace(/<[^>]*>/g, '')
            if (textOnly.length > maxLength) return
          }
          onChange(content)
        }}
        init={{
          height,
          menubar: false,
          ...(selfHosted
            ? {
                base_url: '/tinymce',
                suffix: '.min',
              }
            : {}),
          plugins: [
            'advlist', 'autolink', 'lists', 'link',
            'charmap', 'preview',
            'searchreplace', 'visualblocks',
            'insertdatetime', 'table', 'wordcount',
          ],
          toolbar:
            'bold italic underline strikethrough | ' +
            'bullist numlist | link | ' +
            'alignleft aligncenter alignright | ' +
            'removeformat',
          placeholder,
          content_style: `
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 14px;
              color: #374151;
              line-height: 1.6;
              padding: 4px;
            }
          `,
          branding: false,
          statusbar: false,
          resize: false,
          skin: 'oxide',
          promotion: false,
        }}
      />

      {maxLength && (
        <p className="text-xs text-gray-400 mt-1 text-right">
          {charCount} / {maxLength}
        </p>
      )}
    </div>
  )
}
