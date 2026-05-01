'use client'

export type RangeKey = '7d' | '30d' | '90d' | 'all'

interface Props {
  value: RangeKey
  onChange: (v: RangeKey) => void
  className?: string
}

const OPTIONS: { id: RangeKey; label: string; short: string }[] = [
  { id: '7d', label: 'Last 7 days', short: '7d' },
  { id: '30d', label: 'Last 30 days', short: '30d' },
  { id: '90d', label: 'Last 90 days', short: '90d' },
  { id: 'all', label: 'All time', short: 'All' },
]

export default function DateRangePicker({ value, onChange, className = '' }: Props) {
  return (
    <div className={`inline-flex bg-white border border-gray-200 rounded-lg p-0.5 ${className}`}>
      {OPTIONS.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            value === opt.id
              ? 'bg-brand text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="hidden sm:inline">{opt.label}</span>
          <span className="sm:hidden">{opt.short}</span>
        </button>
      ))}
    </div>
  )
}
