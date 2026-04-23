'use client'

import { ReactNode } from 'react'

interface DesktopFrameProps {
  url: string
  children: ReactNode
}

export default function DesktopFrame({ url, children }: DesktopFrameProps) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-lg overflow-hidden w-full max-w-[900px] mx-auto">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 bg-slate-100 border-b border-slate-200 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" aria-hidden />
          <span className="w-3 h-3 rounded-full bg-amber-400" aria-hidden />
          <span className="w-3 h-3 rounded-full bg-emerald-400" aria-hidden />
        </div>
        <div className="flex-1 ml-2">
          <div className="flex items-center gap-1.5 bg-white rounded-md border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500 font-mono max-w-[420px]">
            <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="truncate">{url}</span>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="bg-white">
        {children}
      </div>
    </div>
  )
}
