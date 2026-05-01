'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { DollarSign, ShoppingBag, TrendingUp, Clock, XCircle } from 'lucide-react'
import KpiCard from '@/components/admin/charts/KpiCard'
import DateRangePicker, { RangeKey } from '@/components/admin/charts/DateRangePicker'
import StatsAreaChart from '@/components/admin/charts/StatsAreaChart'
import StatsDonutChart from '@/components/admin/charts/StatsDonutChart'
import ChartCard from '@/components/admin/charts/ChartCard'
import { shortDate } from '@/lib/adminUtils'

interface Resp {
  range: RangeKey
  kpis: { totalRevenue: number; paidOrders: number; pendingOrders: number; cancelledOrders: number; avgOrderValue: number }
  series: { date: string; revenue: number; orders: number }[]
  byProductType: Record<string, { revenue: number; count: number }>
  topProducts: { name: string; type: string; revenue: number; count: number }[]
  paymentMethods: Record<string, number>
  recentOrders: { id: string; total: number; status: string; method: string; created_at: string }[]
}

function money(n: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(n || 0)
}

const TYPE_COLORS: Record<string, string> = {
  ad_package: '#ec4899',
  banner_package: '#3b82f6',
  subscription: '#10b981',
  other: '#94a3b8',
}

const METHOD_COLORS: Record<string, string> = {
  card: '#3b82f6',
  twint: '#f43f5e',
  phone: '#10b981',
  unknown: '#94a3b8',
}

export default function RevenueStatsPage() {
  const t = useTranslations('admin.stats')
  const tc = useTranslations('admin.common')
  const [range, setRange] = useState<RangeKey>('30d')
  const [data, setData] = useState<Resp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/stats/revenue?range=${range}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" /> {t('revenueTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{t('revenueSubtitle')}</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {loading || !data ? (
        <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            <KpiCard label={t('totalRevenue')} value={money(data.kpis.totalRevenue)} icon={<DollarSign className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" />
            <KpiCard label={t('paidOrders')} value={data.kpis.paidOrders.toLocaleString()} icon={<ShoppingBag className="w-4 h-4" />} accent="text-sky-600 bg-sky-50" />
            <KpiCard label={t('avgOrderValue')} value={money(data.kpis.avgOrderValue)} icon={<TrendingUp className="w-4 h-4" />} accent="text-violet-600 bg-violet-50" />
            <KpiCard label={t('pending')} value={data.kpis.pendingOrders.toLocaleString()} icon={<Clock className="w-4 h-4" />} accent="text-amber-600 bg-amber-50" />
            <KpiCard label={t('cancelled')} value={data.kpis.cancelledOrders.toLocaleString()} icon={<XCircle className="w-4 h-4" />} accent="text-rose-600 bg-rose-50" />
          </div>

          <ChartCard title={t('revenueOverTime')} subtitle={t('dailyPaidOrders')}>
            <StatsAreaChart
              data={data.series.map(d => ({ ...d, date: shortDate(d.date) }))}
              xKey="date"
              series={[{ key: 'revenue', name: t('revenueLine'), color: '#10b981' }]}
              height={320}
            />
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title={t('revenueByProduct')} subtitle={t('revenueByProductSub')}>
              <StatsDonutChart
                data={Object.entries(data.byProductType).map(([k, v]) => ({
                  name: k.replace(/_/g, ' '),
                  value: v.revenue,
                  color: TYPE_COLORS[k] || '#94a3b8',
                }))}
                height={280}
              />
            </ChartCard>

            <ChartCard title={t('paymentMethods')} subtitle={t('ordersByMethod')}>
              <StatsDonutChart
                data={Object.entries(data.paymentMethods).map(([k, v]) => ({
                  name: k.toUpperCase(),
                  value: v,
                  color: METHOD_COLORS[k] || '#94a3b8',
                }))}
                height={280}
              />
            </ChartCard>
          </div>

          <ChartCard title={t('topProducts')} subtitle={t('topProductsSub')}>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">{t('noSales')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 px-2">{t('colHash')}</th>
                      <th className="text-left py-2 px-2">{t('colProduct')}</th>
                      <th className="text-center py-2 px-2">{t('colType')}</th>
                      <th className="text-right py-2 px-2">{t('colUnits')}</th>
                      <th className="text-right py-2 px-2">{t('colRevenue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr key={`${p.name}-${i}`} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2 text-gray-400 font-bold">{i + 1}</td>
                        <td className="py-2 px-2 font-semibold text-gray-800">{p.name}</td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${TYPE_COLORS[p.type] || '#cbd5e1'}22`, color: TYPE_COLORS[p.type] || '#475569' }}>
                            {p.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">{p.count.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right font-bold tabular-nums text-emerald-700">{money(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>

          <ChartCard title={t('recentOrders')} subtitle={t('recentOrdersSub')}>
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">{t('noOrders')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 px-2">{t('colDate')}</th>
                      <th className="text-left py-2 px-2">{t('colOrderId')}</th>
                      <th className="text-center py-2 px-2">{t('colStatus')}</th>
                      <th className="text-center py-2 px-2">{t('colMethod')}</th>
                      <th className="text-right py-2 px-2">{t('colTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map(o => (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2 text-gray-600">{new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="py-2 px-2 font-mono text-xs text-gray-600">{o.id.slice(0, 8)}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            o.status === 'paid' ? 'bg-emerald-100 text-emerald-700'
                            : o.status === 'pending' ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                          }`}>{o.status}</span>
                        </td>
                        <td className="py-2 px-2 text-center text-xs text-gray-600 capitalize">{o.method}</td>
                        <td className="py-2 px-2 text-right font-bold tabular-nums">{money(o.total)}</td>
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
