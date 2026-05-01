'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: number | string
  icon?: React.ReactNode
  accent?: string
  sub?: string
  href?: string
  urgent?: boolean
  delta?: number | null
}

export default function KpiCard({
  label, value, icon, accent = 'text-brand bg-brand/10', sub, href, urgent, delta,
}: KpiCardProps) {
  const body = (
    <div className="relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gray-300 hover:shadow-sm transition-all group h-full">
      {urgent && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      )}
      {href && (
        <ArrowUpRight className="absolute top-3 right-3 w-3.5 h-3.5 text-gray-300 group-hover:text-brand transition-colors" />
      )}
      {icon && (
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${accent} flex items-center justify-center mb-2 sm:mb-3`}>
          {icon}
        </div>
      )}
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-none truncate">{value}</p>
      {(sub || typeof delta === 'number') && (
        <div className="flex items-center gap-2 mt-2">
          {typeof delta === 'number' && (
            <span className={`text-[11px] font-bold ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {delta >= 0 ? '+' : ''}{delta}%
            </span>
          )}
          {sub && <p className="text-[11px] sm:text-xs text-gray-400 truncate">{sub}</p>}
        </div>
      )}
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}
