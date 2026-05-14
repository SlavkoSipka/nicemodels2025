'use client'

import { useTranslations } from 'next-intl'
import { Shuffle } from 'lucide-react'

function CopyForRole({ ownerType }: { ownerType: 'model' | 'club' }) {
  const t = useTranslations('components.bannerPlacementGuide')
  const introKey = ownerType === 'model' ? 'introModel' : 'introClub'
  const pagesKey = ownerType === 'model' ? 'introPagesModel' : 'introPagesClub'

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-slate-600 leading-relaxed">
        {t.rich(introKey, {
          type: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          wide: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          card: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          left: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          violet: chunks => <span className="font-semibold text-violet-800">{chunks}</span>,
        })}
      </p>
      <p className="text-xs text-slate-600 leading-relaxed">
        {t.rich(pagesKey, {
          home: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          girls: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          clubs: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          jobs: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          modelsPath: chunks => (
            <span className="font-mono text-[11px] text-slate-500">{chunks}</span>
          ),
        })}
      </p>
    </div>
  )
}

function FairRotationNote() {
  const t = useTranslations('components.bannerPlacementGuide')

  return (
    <div className="flex gap-3 rounded-xl border border-violet-200/70 bg-gradient-to-r from-violet-50/90 to-fuchsia-50/40 p-3 sm:p-3.5">
      <Shuffle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" aria-hidden />
      <p className="text-xs text-slate-700 leading-relaxed">
        {t.rich('fairRotationBody', {
          semibold: chunks => <span className="font-semibold text-slate-900">{chunks}</span>,
          emphasis: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          wideLabel: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          cardLabel: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
          leftCol: chunks => <span className="font-semibold text-slate-800">{chunks}</span>,
        })}
      </p>
    </div>
  )
}

export default function BannerPlacementPreview({ ownerType }: { ownerType: 'model' | 'club' }) {
  const t = useTranslations('components.bannerPlacementGuide')

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/40 to-violet-50/30 p-4 md:p-6 space-y-4 shadow-[0_2px_16px_rgba(15,23,42,0.04)] ring-1 ring-slate-100/80">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{t('title')}</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100/90 border border-violet-200/80 px-2 py-0.5 rounded-full">
            {t('badge')}
          </span>
        </div>
        <CopyForRole ownerType={ownerType} />
        <FairRotationNote />
      </div>
    </div>
  )
}
