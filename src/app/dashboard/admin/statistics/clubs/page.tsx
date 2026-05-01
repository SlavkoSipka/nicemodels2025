'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('admin.stats')
  const tc = useTranslations('admin.common')
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
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 shrink-0" /> {t('clubsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{t('clubsSubtitle')}</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {loading || !data ? (
        <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KpiCard label={t('profileViews')} value={data.kpis.totalViews.toLocaleString()} icon={<Eye className="w-4 h-4" />} accent="text-blue-600 bg-blue-50" />
            <KpiCard label={t('contactClicks')} value={data.kpis.totalContactClicks.toLocaleString()} icon={<Phone className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" />
            <KpiCard
              label={t('conversionRate')}
              value={data.kpis.totalViews ? `${Math.round((data.kpis.totalContactClicks / data.kpis.totalViews) * 100)}%` : '0%'}
              icon={<Phone className="w-4 h-4" />}
              accent="text-violet-600 bg-violet-50"
              sub={t('contactsPerView')}
            />
          </div>

          <ChartCard title={t('engagementOverTime')} subtitle={t('engagementSubDaily')}>
            <StatsLineChart
              data={data.series.map(d => ({ ...d, date: shortDate(d.date) }))}
              xKey="date"
              series={[
                { key: 'profile_view', name: t('profileViews'), color: '#3b82f6' },
                { key: 'contact_click', name: t('contactClicks'), color: '#10b981' },
              ]}
              height={320}
            />
          </ChartCard>

          <ChartCard title={t('topClubs')} subtitle={t('topClubsSub')}>
            {data.topClubs.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">{tc('noData')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 px-2">{t('colHash')}</th>
                      <th className="text-left py-2 px-2">{t('colClub')}</th>
                      <th className="text-right py-2 px-2">{t('colViews')}</th>
                      <th className="text-right py-2 px-2">{t('colContacts')}</th>
                      <th className="text-right py-2 px-2">{t('colConv')}</th>
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
                              {t('manage')}
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
