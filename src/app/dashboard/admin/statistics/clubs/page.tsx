'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Eye, Phone } from 'lucide-react'
import KpiCard from '@/components/admin/charts/KpiCard'
import DateRangePicker, { RangeKey } from '@/components/admin/charts/DateRangePicker'
import StatsLineChart from '@/components/admin/charts/StatsLineChart'
import ChartCard from '@/components/admin/charts/ChartCard'
import { shortDate } from '@/lib/adminUtils'

interface Resp {
  range: RangeKey
  kpis: { totalViews: number; totalContactClicks: number }
  series: { date: string; profile_view: number; contact_click: number }[]
  topClubs: { id: string; name: string; views: number; contacts: number }[]
}

export default function ClubsStatsPage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [data, setData] = useState<Resp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/stats/clubs?range=${range}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" /> Club Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Profile views and contact clicks</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {loading || !data ? (
        <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KpiCard label="Profile Views" value={data.kpis.totalViews.toLocaleString()} icon={<Eye className="w-4 h-4" />} accent="text-blue-600 bg-blue-50" />
            <KpiCard label="Contact Clicks" value={data.kpis.totalContactClicks.toLocaleString()} icon={<Phone className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" />
            <KpiCard
              label="Conversion Rate"
              value={data.kpis.totalViews ? `${Math.round((data.kpis.totalContactClicks / data.kpis.totalViews) * 100)}%` : '0%'}
              icon={<Phone className="w-4 h-4" />}
              accent="text-violet-600 bg-violet-50"
              sub="Contacts per view"
            />
          </div>

          <ChartCard title="Engagement Over Time" subtitle="Daily activity">
            <StatsLineChart
              data={data.series.map(d => ({ ...d, date: shortDate(d.date) }))}
              xKey="date"
              series={[
                { key: 'profile_view', name: 'Profile views', color: '#3b82f6' },
                { key: 'contact_click', name: 'Contact clicks', color: '#10b981' },
              ]}
              height={320}
            />
          </ChartCard>

          <ChartCard title="Top Clubs" subtitle="Ranked by profile views in selected range">
            {data.topClubs.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No data</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Club</th>
                      <th className="text-right py-2 px-2">Views</th>
                      <th className="text-right py-2 px-2">Contacts</th>
                      <th className="text-right py-2 px-2">Conv.</th>
                      <th className="py-2 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.topClubs.map((c, i) => {
                      const conv = c.views ? Math.round((c.contacts / c.views) * 100) : 0
                      return (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-400 font-bold">{i + 1}</td>
                          <td className="py-2 px-2 font-semibold text-gray-800">{c.name}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{c.views.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right tabular-nums text-emerald-700">{c.contacts.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-bold tabular-nums">{conv}%</td>
                          <td className="py-2 px-2 text-right">
                            <Link href={`/dashboard/admin/clubs/${c.id}`} className="text-xs font-semibold text-brand hover:underline">
                              Manage
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
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
