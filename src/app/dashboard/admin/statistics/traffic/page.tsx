'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Globe, Eye, Users, Lock, AlertCircle } from 'lucide-react'
import KpiCard from '@/components/admin/charts/KpiCard'
import DateRangePicker, { RangeKey } from '@/components/admin/charts/DateRangePicker'
import ChartCard from '@/components/admin/charts/ChartCard'
import { shortDate } from '@/lib/adminUtils'

const StatsAreaChart = dynamic(() => import('@/components/admin/charts/StatsAreaChart'), { ssr: false })
const StatsBarChart = dynamic(() => import('@/components/admin/charts/StatsBarChart'), { ssr: false })
const StatsDonutChart = dynamic(() => import('@/components/admin/charts/StatsDonutChart'), { ssr: false })

interface TrafficResp {
  range: RangeKey
  kpis: { totalViews: number; uniqueVisitors: number; loggedIn: number; anonymous: number; topPath: string | null }
  series: { date: string; views: number }[]
  topPaths: { path: string; views: number }[]
  topReferrers: { source: string; visits: number }[]
  roleCounts: Record<string, number>
}

export default function TrafficStatsPage() {
  const t = useTranslations('admin.stats')
  const tc = useTranslations('admin.common')
  const [range, setRange] = useState<RangeKey>('30d')
  const [data, setData] = useState<TrafficResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/admin/stats/traffic?range=${range}`)
      .then(async r => {
        const d = await r.json()
        if (!r.ok || !d?.kpis) {
          setError(d?.error || tc('loadFailed'))
          setData(null)
        } else {
          setData(d)
        }
        setLoading(false)
      })
      .catch(() => {
        setError(tc('loadFailed'))
        setLoading(false)
      })
  }, [range])

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500 shrink-0" /> {t('trafficTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{t('trafficSubtitle')}</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      ) : !data?.kpis ? null : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label={t('totalPageViews')} value={data.kpis.totalViews.toLocaleString()} icon={<Eye className="w-4 h-4" />} accent="text-sky-600 bg-sky-50" />
            <KpiCard label={t('uniqueVisitors')} value={data.kpis.uniqueVisitors.toLocaleString()} icon={<Users className="w-4 h-4" />} accent="text-brand bg-brand/10" />
            <KpiCard label={t('loggedInViews')} value={data.kpis.loggedIn.toLocaleString()} icon={<Lock className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" sub={data.kpis.totalViews ? t('ofTotal', { percent: Math.round((data.kpis.loggedIn / data.kpis.totalViews) * 100) }) : undefined} />
            <KpiCard label={t('anonymousViews')} value={data.kpis.anonymous.toLocaleString()} icon={<Globe className="w-4 h-4" />} accent="text-violet-600 bg-violet-50" sub={data.kpis.totalViews ? t('ofTotal', { percent: Math.round((data.kpis.anonymous / data.kpis.totalViews) * 100) }) : undefined} />
          </div>

          <ChartCard title={t('pageViewsOverTime')} subtitle={t('dailyTraffic')}>
            <StatsAreaChart
              data={data.series.map(d => ({ ...d, date: shortDate(d.date) }))}
              xKey="date"
              series={[{ key: 'views', name: 'Page views', color: '#0ea5e9' }]}
              height={320}
            />
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title={t('topPages')} subtitle={t('topPagesSub')}>
              {data.topPaths.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">{tc('noData')}</p>
              ) : (
                <StatsBarChart
                  data={data.topPaths.map(p => ({ path: p.path.length > 28 ? p.path.slice(0, 28) + '…' : p.path, views: p.views }))}
                  xKey="path"
                  layout="horizontal"
                  series={[{ key: 'views', name: t('colViews'), color: '#ec4899' }]}
                  height={360}
                />
              )}
            </ChartCard>

            <ChartCard title={t('visitorType')} subtitle={t('visitorTypeSub')}>
              <StatsDonutChart
                data={[
                  { name: t('anonymous'), value: data.roleCounts.anonymous || 0, color: '#cbd5e1' },
                  { name: 'Visitors', value: data.roleCounts.user || 0, color: '#8b5cf6' },
                  { name: 'Models', value: data.roleCounts.model || 0, color: '#ec4899' },
                  { name: 'Clubs', value: data.roleCounts.company || 0, color: '#3b82f6' },
                  { name: 'Admins', value: data.roleCounts.admin || 0, color: '#64748b' },
                ]}
                height={360}
              />
            </ChartCard>
          </div>

          <ChartCard title={t('topReferrers')} subtitle={t('topReferrersSub')}>
            {data.topReferrers.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">{t('noReferrer')}</p>
            ) : (
              <div className="space-y-1">
                {data.topReferrers.map((r, i) => {
                  const pct = data.kpis.totalViews ? (r.visits / data.kpis.totalViews) * 100 : 0
                  return (
                    <div key={r.source} className="flex items-center gap-3 py-2">
                      <span className="w-5 h-5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-800 w-40 truncate">{r.source}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${Math.max(2, pct)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-500 tabular-nums w-12 text-right">
                        {r.visits.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </ChartCard>
        </>
      )}
    </div>
  )
}
