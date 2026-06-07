'use client'

import { Megaphone, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function MobileLeftBannerBottomPreview({
  previewUrl,
  size = 'md',
}: {
  previewUrl?: string | null
  size?: 'md' | 'sm'
}) {
  const t = useTranslations('components.bannerPreviewMock')
  const sm = size === 'sm'

  return (
    <div
      className={
        sm
          ? 'shrink-0 border-t border-slate-200/80 bg-slate-50 px-0.5 pt-0.5 pb-0.5'
          : 'shrink-0 border-t border-slate-200/70 bg-slate-50 px-2 pt-1.5 pb-2'
      }
    >
      <div
        className={`relative overflow-hidden ${sm ? 'rounded-md' : 'rounded-2xl'}`}
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03)',
        }}
      >
        <span
          className={`pointer-events-none absolute z-10 inline-flex items-center justify-center rounded-full bg-white/90 text-slate-500 border border-black/5 ${
            sm ? 'top-0.5 right-0.5 h-3 w-3' : 'top-1.5 right-1.5 h-7 w-7'
          }`}
          aria-hidden
        >
          <X className={sm ? 'w-1.5 h-1.5' : 'w-3.5 h-3.5'} />
        </span>
        <div className={sm ? 'overflow-hidden py-1 pl-1 pr-5' : 'overflow-hidden py-2 pl-2 pr-11'}>
          <div className="flex gap-1.5">
            <div
              className={`relative shrink-0 overflow-hidden rounded-md bg-slate-100 border border-black/[0.06] ${
                sm ? 'w-5 h-[30px]' : 'w-14 h-[72px]'
              }`}
            >
              {previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-md opacity-60" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="" className="absolute inset-0 w-full h-full object-contain" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center">
                  <Megaphone className={sm ? 'w-2 h-2 text-white' : 'w-6 h-6 text-white'} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <p
        className={`text-center font-semibold text-slate-500 mt-1 px-0.5 leading-tight ${
          sm ? 'text-[4px]' : 'text-[7px]'
        }`}
      >
        {t('leftColumnMobileCaption')}
      </p>
    </div>
  )
}
