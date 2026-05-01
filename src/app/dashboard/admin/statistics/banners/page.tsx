'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Megaphone, Eye, MousePointerClick, TrendingUp } from 'lucide-react'
import KpiCard from '@/components/admin/charts/KpiCard'
import DateRangePicker, { RangeKey } from '@/components/admin/charts/DateRangePicker'
import StatsLineChart from '@/components/admin/charts/StatsLineChart'
import StatsDonutChart from '@/components/admin/charts/StatsDonutChart'
import ChartCard from '@/components/admin/charts/ChartCard'
import { shortDate } from '@/lib/adminUtils'

interface Resp {
  range: RangeKey
  kpis: { totalImpressions: number; totalClicks: number; overallCtr: number; activeBanners: number; pendingBanners: number }
  statusCounts: Record<string, number>
  series: { date: string; impressions: number; clicks: number }[]
  topBanners: { id: string; title: string; status: string; owner_type: string; impressions: number; clicks: number; ctr: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  pending: '#f59e0b',
  expired: '#94a3b8',
  rejected: '#ef4444',
}

export default function BannersStatsPage() {
  const t = useTranslations('admin.stats')
  const tc = useTranslations('admin.common')
  const [range, setRange] = useState<RangeKey>('30d')
  const [data, setData] = useState<Resp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/stats/banners?range=${range}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 shrink-0" /> {t('bannersTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{t('bannersSubtitle')}</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {loading || !data ? (
        <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            <KpiCard label={t('impressions')} value={data.kpis.totalImpressions.toLocaleString()} icon={<Eye className="w-4 h-4" />} accent="text-sky-600 bg-sky-50" />
            <KpiCard label={t('clicks')} value={data.kpis.totalClicks.toLocaleString()} icon={<MousePointerClick className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" />
            <KpiCard label={t('overallCtr')} value={`${data.kpis.overallCtr}%`} icon={<TrendingUp className="w-4 h-4" />} accent="text-violet-600 bg-violet-50" />
            <KpiCard label={t('active')} value={data.kpis.activeBanners.toLocaleString()} icon={<Megaphone className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" href="/dashboard/admin/banners" />
            <KpiCard label={t('pending')} value={data.kpis.pendingBanners.toLocaleString()} icon={<Megaphone className="w-4 h-4" />} accent="text-amber-600 bg-amber-50" href="/dashboard/admin/banners" urgent={data.kpis.pendingBanners > 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title={t('impressionsVsClicks')} subtitle={t('dailyBreakdown')} className="lg:col-span-2">
              <StatsLineChart
                data={data.series.map(d => ({ ...d, date: shortDate(d.date) }))}
                xKey="date"
                series={[
                  { key: 'impressions', name: t('impressions'), color: '#0ea5e9' },
                  { key: 'clicks', name: t('clicks'), color: '#ec4899' },
                ]}
                height={320}
              />
            </ChartCard>

            <ChartCard title={t('bannerStatus')} subtitle={t('allBanners')}>
              <StatsDonutChart
                data={Object.entries(data.statusCounts).map(([k, v]) => ({
                  name: k.charAt(0).toUpperCase() + k.slice(1),
                  value: v,
                  color: STATUS_COLORS[k] || '#cbd5e1',
                }))}
                height={320}
              />
            </ChartCard>
          </div>

          <ChartCard title={t('topBanners')} subtitle={t('topBannersSub')}>
            {data.topBanners.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">{tc('noDataYet')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 px-2">{t('colHash')}</th>
                      <th className="text-left py-2 px-2">Banner</th>
                      <th className="text-center py-2 px-2">{t('colOwner')}</th>
                      <th className="text-center py-2 px-2">{t('colStatus')}</th>
                      <th className="text-right py-2 px-2">{t('colImpressions')}</th>
                      <th className="text-right py-2 px-2">{t('colClicks')}</th>
                      <th className="text-right py-2 px-2">{t('colCtr')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topBanners.map((b, i) => (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2 text-gray-400 font-bold">{i + 1}</td>
                        <td className="py-2 px-2 font-semibold text-gray-800 truncate max-w-xs">
                          <Link href="/dashboard/admin/banners" className="hover:text-brand">{b.title}</Link>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                            {b.owner_type}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: `${STATUS_COLORS[b.status] || '#cbd5e1'}22`, color: STATUS_COLORS[b.status] || '#475569' }}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">{b.impressions.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right tabular-nums text-emerald-700">{b.clicks.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right font-bold tabular-nums">{b.ctr.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </>
      )}
    </div>
  )
}
