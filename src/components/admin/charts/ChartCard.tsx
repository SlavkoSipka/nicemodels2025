'use client'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  right?: React.ReactNode
}

export default function ChartCard({ title, subtitle, children, className = '', right }: Props) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-3 sm:p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 truncate">{title}</h3>
          {subtitle && <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  )
}
