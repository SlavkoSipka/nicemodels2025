'use client'

import { useState } from 'react'
import { Monitor, Smartphone, Eye } from 'lucide-react'
import DesktopFrame from './DesktopFrame'
import PhoneFrame from './PhoneFrame'
import HomeFeedMock from './mocks/HomeFeedMock'
import JobsRentsMock from './mocks/JobsRentsMock'
import type { PreviewHighlight, PreviewMode, PreviewPage } from './types'

interface SitePreviewProps {
  page: PreviewPage
  highlight: PreviewHighlight
  title?: string
  previewUrl?: string | null
  listingTitle?: string
  listingLocation?: string
}

export default function SitePreview({
  page,
  highlight,
  title = 'Preview',
  previewUrl,
  listingTitle,
  listingLocation,
}: SitePreviewProps) {
  const [mode, setMode] = useState<PreviewMode>('desktop')

  const urlForPage = page === 'jobs-rents' ? 'nicemodels.ch/jobs-rents' : 'nicemodels.ch'

  const sidebarDesktopOnly = highlight === 'banner-sidebar' && mode === 'mobile'

  const content =
    page === 'jobs-rents' ? (
      <JobsRentsMock
        mode={mode}
        highlight={highlight}
        listingTitle={listingTitle}
        listingLocation={listingLocation}
      />
    ) : (
      <HomeFeedMock mode={mode} highlight={highlight} previewUrl={previewUrl ?? undefined} />
    )

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/40 to-violet-50/30 p-4 md:p-6 space-y-4 shadow-[0_2px_16px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <Eye className="w-4 h-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Live preview</p>
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">{title}</p>
          </div>
        </div>

        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              mode === 'desktop'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            aria-pressed={mode === 'desktop'}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              mode === 'mobile'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            aria-pressed={mode === 'mobile'}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>
      </div>

      <div className="relative rounded-xl bg-gradient-to-b from-slate-100 to-slate-50 p-3 md:p-4 border border-slate-200/70 flex items-center justify-center">
        {mode === 'desktop' ? (
          <DesktopFrame url={urlForPage}>{content}</DesktopFrame>
        ) : (
          <PhoneFrame>{content}</PhoneFrame>
        )}
      </div>

      {sidebarDesktopOnly && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="font-semibold">Note:</span> The left column banner is <span className="font-semibold">desktop-only</span> and does not appear on mobile devices.
        </div>
      )}
    </div>
  )
}
