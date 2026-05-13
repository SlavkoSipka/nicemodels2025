'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Briefcase, Eye, MousePointerClick, CheckCircle } from 'lucide-react'
import KpiCard from '@/components/admin/charts/KpiCard'
import DateRangePicker, { RangeKey } from '@/components/admin/charts/DateRangePicker'
import ChartCard from '@/components/admin/charts/ChartCard'
import { shortDate } from '@/lib/adminUtils'

const StatsLineChart = dynamic(() => import('@/components/admin/charts/StatsLineChart'), { ssr: false })
const StatsDonutChart = dynamic(() => import('@/components/admin/charts/StatsDonutChart'), { ssr: false })

interface Resp {
  range: RangeKey
  kpis: { totalViews: number; totalClicks: number; activeJobs: number; activeRents: number; expired: number }
  clicksByType: Record<string, number>
  series: { date: string; views: number; clicks: number }[]
  topListings: { id: string; title: string; type: string; status: string; views: number; clicks: number }[]
}

const CLICK_TYPE_COLORS: Record<string, string> = {
  phone: '#3b82f6',
  sms: '#10b981',
  email: '#8b5cf6',
  website: '#f59e0b',
  whatsapp: '#22c55e',
  viber: '#7360f2',
  telegram: '#26a5e4',
}

export default function ListingsStatsPage() {
  const t = useTranslations('admin.stats')
  const tc = useTranslations('admin.common')
  const [range, setRange] = useState<RangeKey>('30d')
  const [data, setData] = useState<Resp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/stats/listings?range=${range}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 shrink-0" /> {t('listingsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{t('listingsSubtitle')}</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {loading || !data ? (
        <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            <KpiCard label={t('totalViews')} value={data.kpis.totalViews.toLocaleString()} icon={<Eye className="w-4 h-4" />} accent="text-sky-600 bg-sky-50" />
            <KpiCard label={t('totalClicks')} value={data.kpis.totalClicks.toLocaleString()} icon={<MousePointerClick className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" sub={data.kpis.totalViews ? t('ctr', { percent: Math.round((data.kpis.totalClicks / data.kpis.totalViews) * 100) }) : undefined} />
            <KpiCard label={t('activeJobs')} value={data.kpis.activeJobs.toLocaleString()} icon={<Briefcase className="w-4 h-4" />} accent="text-purple-600 bg-purple-50" />
            <KpiCard label={t('activeRents')} value={data.kpis.activeRents.toLocaleString()} icon={<Briefcase className="w-4 h-4" />} accent="text-amber-600 bg-amber-50" />
            <KpiCard label={t('expired')} value={data.kpis.expired.toLocaleString()} icon={<CheckCircle className="w-4 h-4" />} accent="text-gray-600 bg-gray-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard title={t('viewsAndClicks')} subtitle={t('dailyBreakdown')} className="lg:col-span-2">
              <StatsLineChart
                data={data.series.map(d => ({ ...d, date: shortDate(d.date) }))}
                xKey="date"
                series={[
                  { key: 'views', name: t('colViews'), color: '#0ea5e9' },
                  { key: 'clicks', name: t('colClicks'), color: '#10b981' },
                ]}
                height={320}
              />
            </ChartCard>

            <ChartCard title={t('clickTypes')} subtitle={t('clickTypesSub')}>
              <StatsDonutChart
                data={Object.entries(data.clicksByType).map(([k, v]) => ({
                  name: k.charAt(0).toUpperCase() + k.slice(1),
                  value: v,
                  color: CLICK_TYPE_COLORS[k] || '#cbd5e1',
                }))}
                height={320}
              />
            </ChartCard>
          </div>

          <ChartCard title={t('topListings')} subtitle={t('topListingsSub')}>
            {data.topListings.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">{tc('noData')}</p>
            ) : (
              <>
                <div className="md:hidden space-y-2">
                  {data.topListings.map((l, i) => {
                    const ctr = l.views ? Math.round((l.clicks / l.views) * 100) : 0
                    return (
                      <div key={l.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-xs font-bold text-gray-400 pt-0.5">#{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{l.title}</p>
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${l.type === 'rent' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                                  {l.type.toUpperCase()}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${l.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {l.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Link href={`/dashboard/admin/jobs-rents/${l.id}`} className="text-xs font-semibold text-brand shrink-0">{t('manage')}</Link>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div><p className="text-[10px] text-gray-400 uppercase">{t('colViews')}</p><p className="text-xs font-bold tabular-nums">{l.views.toLocaleString()}</p></div>
                          <div><p className="text-[10px] text-gray-400 uppercase">{t('colClicks')}</p><p className="text-xs font-bold tabular-nums text-emerald-700">{l.clicks.toLocaleString()}</p></div>
                          <div><p className="text-[10px] text-gray-400 uppercase">{t('colCtr')}</p><p className="text-xs font-bold tabular-nums">{ctr}%</p></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 px-2">{t('colHash')}</th>
                      <th className="text-left py-2 px-2">{t('colTitle')}</th>
                      <th className="text-center py-2 px-2">{t('colType')}</th>
                      <th className="text-center py-2 px-2">{t('colStatus')}</th>
                      <th className="text-right py-2 px-2">{t('colViews')}</th>
                      <th className="text-right py-2 px-2">{t('colClicks')}</th>
                      <th className="text-right py-2 px-2">{t('colCtr')}</th>
                      <th className="py-2 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.topListings.map((l, i) => {
                      const ctr = l.views ? Math.round((l.clicks / l.views) * 100) : 0
                      return (
                        <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-400 font-bold">{i + 1}</td>
                          <td className="py-2 px-2 font-semibold text-gray-800 truncate max-w-xs">{l.title}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.type === 'rent' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                              {l.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums">{l.views.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right tabular-nums text-emerald-700">{l.clicks.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-bold tabular-nums">{ctr}%</td>
                          <td className="py-2 px-2 text-right">
                            <Link href={`/dashboard/admin/jobs-rents/${l.id}`} className="text-xs font-semibold text-brand hover:underline">
                              {t('manage')}
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </ChartCard>
        </>
      )}
    </div>
  )
}
