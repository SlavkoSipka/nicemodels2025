'use client'

import { Monitor, Smartphone, Info } from 'lucide-react'

interface BannerPlacementPreviewProps {
  previewUrl?: string | null
}

function SkeletonCard() {
  return (
    <div
      className="rounded-md bg-gradient-to-b from-gray-200 to-gray-100 relative overflow-hidden"
      style={{ aspectRatio: '3/4' }}
    >
      <div className="absolute bottom-0 left-0 right-0 p-1.5 space-y-1">
        <div className="h-1.5 bg-white/70 rounded w-3/4" />
        <div className="h-1 bg-white/50 rounded w-1/2" />
      </div>
    </div>
  )
}

function BannerSlot({ previewUrl, label }: { previewUrl?: string | null; label: string }) {
  return (
    <div
      className="col-span-2 relative overflow-hidden rounded-md"
      style={{
        aspectRatio: '4/1',
        border: previewUrl ? '2px solid rgba(236,72,153,0.6)' : '2px dashed rgba(236,72,153,0.6)',
        background: previewUrl ? '#000' : 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(236,72,153,0.16))',
      }}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="Banner preview" className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-pink-600">
            {label}
          </span>
        </div>
      )}
      <div className="absolute top-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
        BANNER
      </div>
    </div>
  )
}

function MobileBannerSlot({ previewUrl, label }: { previewUrl?: string | null; label: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-md"
      style={{
        aspectRatio: '4/1',
        border: previewUrl ? '2px solid rgba(236,72,153,0.6)' : '2px dashed rgba(236,72,153,0.6)',
        background: previewUrl ? '#000' : 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(236,72,153,0.16))',
      }}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="Banner preview" className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wider text-pink-600">
            {label}
          </span>
        </div>
      )}
      <div className="absolute top-1 right-1 bg-black/70 text-white text-[7px] font-bold px-1 py-0.5 rounded">
        BANNER
      </div>
    </div>
  )
}

export default function BannerPlacementPreview({ previewUrl }: BannerPlacementPreviewProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="mb-4">
        <p className="text-sm font-bold text-gray-800">How your banner will be displayed</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Preview of desktop and mobile placement between model cards on the homepage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 items-start">

        {/* ============ DESKTOP MOCKUP ============ */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Monitor className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-700">Desktop / Tablet</span>
          </div>

          <div className="rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border-b border-gray-200">
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-2 px-2 py-0.5 bg-white rounded text-[10px] text-gray-500 text-center truncate">
                nicemodels.ch
              </div>
            </div>

            {/* Content */}
            <div className="p-3 bg-gray-50">
              <div className="grid grid-cols-2 gap-2">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />

                <BannerSlot previewUrl={previewUrl} label="Your banner here" />

                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
            Banner spans <span className="font-semibold text-gray-700">full width</span> across both
            model card columns.
          </p>
        </div>

        {/* ============ PHONE MOCKUP ============ */}
        <div className="flex flex-col items-center lg:items-start">
          <div className="flex items-center gap-1.5 mb-2">
            <Smartphone className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-700">Mobile</span>
          </div>

          <div
            className="mx-auto lg:mx-0 bg-gray-900 p-2 shadow-lg"
            style={{
              borderRadius: '2rem',
              width: '220px',
            }}
          >
            {/* Notch */}
            <div className="flex justify-center mb-1">
              <div className="w-16 h-4 bg-black rounded-b-xl" />
            </div>

            {/* Phone screen */}
            <div
              className="bg-white overflow-hidden"
              style={{ borderRadius: '1.25rem' }}
            >
              {/* Status bar */}
              <div className="flex items-center justify-between px-3 py-1 bg-white text-[8px] text-gray-500">
                <span className="font-semibold">9:41</span>
                <span>nicemodels.ch</span>
              </div>

              {/* Content */}
              <div className="p-2 bg-gray-50 space-y-2">
                <SkeletonCard />
                <SkeletonCard />

                <MobileBannerSlot previewUrl={previewUrl} label="Your banner" />

                <SkeletonCard />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 mt-2 leading-relaxed text-center lg:text-left">
            Full screen width, same <span className="font-semibold text-gray-700">4:1 ratio</span>.
          </p>
        </div>
      </div>

      {/* Spec info box */}
      <div className="mt-5 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-0.5">
          <p>
            <span className="font-bold">Recommended size:</span> 1600 × 400 px (ratio 4:1)
          </p>
          <p>
            <span className="font-bold">Max file size:</span> 10 MB &middot; JPG, PNG, WebP
          </p>
          <p>
            <span className="font-bold">Placement:</span> appears every 6 model cards on the homepage.
          </p>
        </div>
      </div>
    </div>
  )
}
