'use client'

import { useEffect, useState } from 'react'
import { Globe, Eye, Users, Lock } from 'lucide-react'
import KpiCard from '@/components/admin/charts/KpiCard'
import DateRangePicker, { RangeKey } from '@/components/admin/charts/DateRangePicker'
import StatsAreaChart from '@/components/admin/charts/StatsAreaChart'
import StatsBarChart from '@/components/admin/charts/StatsBarChart'
import StatsDonutChart from '@/components/admin/charts/StatsDonutChart'
import ChartCard from '@/components/admin/charts/ChartCard'
import { shortDate } from '@/lib/adminUtils'

interface TrafficResp {
  range: RangeKey
  kpis: { totalViews: number; uniqueVisitors: number; loggedIn: number; anonymous: number; topPath: string | null }
  series: { date: string; views: number }[]
  topPaths: { path: string; views: number }[]
  topReferrers: { source: string; visits: number }[]
  roleCounts: Record<string, number>
}

export default function TrafficStatsPage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [data, setData] = useState<TrafficResp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/stats/traffic?range=${range}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-sky-500" /> Site Traffic
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Page views across the entire site</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {loading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Total Page Views" value={data.kpis.totalViews.toLocaleString()} icon={<Eye className="w-4 h-4" />} accent="text-sky-600 bg-sky-50" />
            <KpiCard label="Unique Visitors" value={data.kpis.uniqueVisitors.toLocaleString()} icon={<Users className="w-4 h-4" />} accent="text-brand bg-brand/10" />
            <KpiCard label="Logged-in Views" value={data.kpis.loggedIn.toLocaleString()} icon={<Lock className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" sub={data.kpis.totalViews ? `${Math.round((data.kpis.loggedIn / data.kpis.totalViews) * 100)}% of total` : undefined} />
            <KpiCard label="Anonymous Views" value={data.kpis.anonymous.toLocaleString()} icon={<Globe className="w-4 h-4" />} accent="text-violet-600 bg-violet-50" sub={data.kpis.totalViews ? `${Math.round((data.kpis.anonymous / data.kpis.totalViews) * 100)}% of total` : undefined} />
          </div>

          <ChartCard title="Page Views Over Time" subtitle="Daily traffic">
            <StatsAreaChart
              data={data.series.map(d => ({ ...d, date: shortDate(d.date) }))}
              xKey="date"
              series={[{ key: 'views', name: 'Page views', color: '#0ea5e9' }]}
              height={320}
            />
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Top Pages" subtitle="Most visited paths">
              {data.topPaths.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No data</p>
              ) : (
                <StatsBarChart
                  data={data.topPaths.map(p => ({ path: p.path.length > 28 ? p.path.slice(0, 28) + '…' : p.path, views: p.views }))}
                  xKey="path"
                  layout="horizontal"
                  series={[{ key: 'views', name: 'Views', color: '#ec4899' }]}
                  height={360}
                />
              )}
            </ChartCard>

            <ChartCard title="Visitor Type" subtitle="Logged-in vs anonymous by role">
              <StatsDonutChart
                data={[
                  { name: 'Anonymous', value: data.roleCounts.anonymous || 0, color: '#cbd5e1' },
                  { name: 'Visitors', value: data.roleCounts.user || 0, color: '#8b5cf6' },
                  { name: 'Models', value: data.roleCounts.model || 0, color: '#ec4899' },
                  { name: 'Clubs', value: data.roleCounts.company || 0, color: '#3b82f6' },
                  { name: 'Admins', value: data.roleCounts.admin || 0, color: '#64748b' },
                ]}
                height={360}
              />
            </ChartCard>
          </div>

          <ChartCard title="Top Referrers" subtitle="Where your visitors come from">
            {data.topReferrers.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No referrer data</p>
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
