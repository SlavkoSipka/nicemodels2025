'use client'

import { ReactNode } from 'react'

interface PhoneFrameProps {
  children: ReactNode
  compact?: boolean
}

export default function PhoneFrame({ children, compact = false }: PhoneFrameProps) {
  return (
    <div className={`mx-auto ${compact ? 'w-[220px]' : 'w-[280px]'}`}>
      <div className="relative rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-[110px] h-5 bg-slate-900 rounded-b-2xl flex items-center justify-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-slate-700" aria-hidden />
          <span className="w-10 h-1.5 rounded-full bg-slate-800" aria-hidden />
        </div>

        {/* Screen */}
        <div className={`relative bg-white overflow-y-auto ${compact ? 'max-h-[320px]' : 'max-h-[520px]'}`}>
          {/* Status bar */}
          <div className="h-6 flex items-center justify-between px-5 text-[9px] font-semibold text-slate-900 pt-1">
            <span>9:41</span>
            <span className="flex items-center gap-0.5">
              <span className="text-[8px]">●●●●</span>
              <span>100%</span>
            </span>
          </div>
          {children}
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-white/80" aria-hidden />
      </div>
    </div>
  )
}
