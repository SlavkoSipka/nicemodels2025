import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Megaphone } from 'lucide-react'

/**
 * "Your ad here" tile for a side rail nobody has booked. Same 2:3 portrait
 * frame as `BannerSidebarRail`, so the column keeps its shape whether the
 * slot is sold or not, and it sends advertisers to the contact form with the
 * advertising subject preselected.
 */
export default function AdSpacePlaceholder() {
  const t = useTranslations('home.adSpace')

  return (
    <Link
      href="/contact?subject=advertising"
      className="group flex w-full max-w-[240px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 text-center transition-colors"
      style={{ aspectRatio: '2/3', borderColor: 'rgba(236,72,153,0.35)', background: 'rgba(255,255,255,0.55)' }}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: '#fce7f3' }}>
        <Megaphone className="h-6 w-6" style={{ color: '#be185d' }} />
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: '#be185d' }}>
        {t('label')}
      </span>
      <span className="text-lg font-bold leading-snug text-gray-900">{t('title')}</span>
      <span className="text-[13px] leading-relaxed text-gray-500">{t('text')}</span>
      <span
        className="mt-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity group-hover:opacity-90"
        style={{ background: '#ec4899' }}
      >
        {t('cta')}
      </span>
    </Link>
  )
}
