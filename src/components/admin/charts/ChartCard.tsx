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
    <div className={`bg-white border border-gray-200 rounded-xl p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}
