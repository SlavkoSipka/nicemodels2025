'use client'

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
  const charCount = value?.length ?? 0

  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-gray-800 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <textarea
        value={value}
        onChange={(e) => {
          const v = e.target.value
          if (maxLength != null && v.length > maxLength) return
          onChange(v)
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={Math.max(8, Math.ceil(height / 28))}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-y text-gray-900 placeholder:text-gray-400"
        style={{ minHeight: height }}
      />

      {maxLength != null && (
        <p className="text-xs text-gray-400 mt-1 text-right">
          {charCount} / {maxLength}
        </p>
      )}
    </div>
  )
}
