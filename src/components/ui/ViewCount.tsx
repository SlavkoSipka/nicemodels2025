import { Eye } from 'lucide-react'

interface ViewCountProps {
  count: number
  variant?: 'badge' | 'inline'
  className?: string
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  if (n < 1_000_000) return `${Math.floor(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}

export default function ViewCount({ count, variant = 'badge', className = '' }: ViewCountProps) {
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 ${className}`}>
        <Eye className="w-3 h-3" aria-hidden />
        {formatCount(count)}
        <span className="font-medium text-slate-400">{count === 1 ? 'view' : 'views'}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${className}`}
      style={{
        background: 'rgba(0,0,0,0.50)',
        color: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
      }}
      title={`${count.toLocaleString()} ${count === 1 ? 'view' : 'views'}`}
    >
      <Eye className="w-3 h-3" aria-hidden />
      {formatCount(count)}
    </span>
  )
}
