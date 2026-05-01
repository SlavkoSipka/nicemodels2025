'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Users, Eye, Heart, Share2, Phone } from 'lucide-react'
import KpiCard from '@/components/admin/charts/KpiCard'
import DateRangePicker, { RangeKey } from '@/components/admin/charts/DateRangePicker'
import StatsLineChart from '@/components/admin/charts/StatsLineChart'
import ChartCard from '@/components/admin/charts/ChartCard'
import { shortDate } from '@/lib/adminUtils'

interface Resp {
  range: RangeKey
  kpis: { totalViews: number; totalContactViews: number; totalFavorites: number; totalShares: number }
  series: { date: string; profile_view: number; contact_view: number; favorite_add: number; share: number }[]
  topModels: { id: string; name: string; views: number; contacts: number; favorites: number }[]
}

export default function ModelsStatsPage() {
  const t = useTranslations('admin.stats')
  const tc = useTranslations('admin.common')
  const [range, setRange] = useState<RangeKey>('30d')
  const [data, setData] = useState<Resp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/stats/models?range=${range}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-brand shrink-0" /> {t('modelsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{t('modelsSubtitle')}</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {loading || !data ? (
        <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label={t('profileViews')} value={data.kpis.totalViews.toLocaleString()} icon={<Eye className="w-4 h-4" />} accent="text-sky-600 bg-sky-50" />
            <KpiCard label={t('contactViews')} value={data.kpis.totalContactViews.toLocaleString()} icon={<Phone className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" sub={data.kpis.totalViews ? t('conversion', { percent: Math.round((data.kpis.totalContactViews / data.kpis.totalViews) * 100) }) : undefined} />
            <KpiCard label={t('favoritesAdded')} value={data.kpis.totalFavorites.toLocaleString()} icon={<Heart className="w-4 h-4" />} accent="text-rose-600 bg-rose-50" />
            <KpiCard label={t('shares')} value={data.kpis.totalShares.toLocaleString()} icon={<Share2 className="w-4 h-4" />} accent="text-violet-600 bg-violet-50" />
          </div>

          <ChartCard title={t('engagementOverTime')} subtitle={t('engagementSub')}>
            <StatsLineChart
              data={data.series.map(d => ({ ...d, date: shortDate(d.date) }))}
              xKey="date"
              series={[
                { key: 'profile_view', name: t('profileViews'), color: '#0ea5e9' },
                { key: 'contact_view', name: t('contactViews'), color: '#10b981' },
                { key: 'favorite_add', name: t('colFavorites'), color: '#ec4899' },
                { key: 'share', name: t('shares'), color: '#8b5cf6' },
              ]}
              height={320}
            />
          </ChartCard>

          <ChartCard title={t('topModels')} subtitle={t('topModelsSub')}>
            {data.topModels.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">{tc('noData')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 px-2">{t('colHash')}</th>
                      <th className="text-left py-2 px-2">{t('colModel')}</th>
                      <th className="text-right py-2 px-2">{t('colViews')}</th>
                      <th className="text-right py-2 px-2">{t('colContacts')}</th>
                      <th className="text-right py-2 px-2">{t('colFavorites')}</th>
                      <th className="text-right py-2 px-2">{t('colConv')}</th>
                      <th className="py-2 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.topModels.map((m, i) => {
                      const conv = m.views ? Math.round((m.contacts / m.views) * 100) : 0
                      return (
                        <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-400 font-bold">{i + 1}</td>
                          <td className="py-2 px-2 font-semibold text-gray-800">{m.name}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{m.views.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right tabular-nums text-emerald-700">{m.contacts.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right tabular-nums text-rose-600">{m.favorites.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-bold tabular-nums">{conv}%</td>
                          <td className="py-2 px-2 text-right">
                            <Link href={`/dashboard/admin/models/${m.id}`} className="text-xs font-semibold text-brand hover:underline">
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
