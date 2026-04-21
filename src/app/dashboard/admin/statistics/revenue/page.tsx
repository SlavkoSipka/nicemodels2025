'use client'

import { useEffect, useState } from 'react'
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
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" /> Revenue
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Orders, products &amp; payments</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {loading || !data ? (
        <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard label="Total Revenue" value={money(data.kpis.totalRevenue)} icon={<DollarSign className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" />
            <KpiCard label="Paid Orders" value={data.kpis.paidOrders.toLocaleString()} icon={<ShoppingBag className="w-4 h-4" />} accent="text-sky-600 bg-sky-50" />
            <KpiCard label="Avg Order Value" value={money(data.kpis.avgOrderValue)} icon={<TrendingUp className="w-4 h-4" />} accent="text-violet-600 bg-violet-50" />
            <KpiCard label="Pending" value={data.kpis.pendingOrders.toLocaleString()} icon={<Clock className="w-4 h-4" />} accent="text-amber-600 bg-amber-50" />
            <KpiCard label="Cancelled" value={data.kpis.cancelledOrders.toLocaleString()} icon={<XCircle className="w-4 h-4" />} accent="text-rose-600 bg-rose-50" />
          </div>

          <ChartCard title="Revenue Over Time" subtitle="Daily paid orders">
            <StatsAreaChart
              data={data.series.map(d => ({ ...d, date: shortDate(d.date) }))}
              xKey="date"
              series={[{ key: 'revenue', name: 'Revenue (CHF)', color: '#10b981' }]}
              height={320}
            />
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Revenue by Product Type" subtitle="Distribution across products">
              <StatsDonutChart
                data={Object.entries(data.byProductType).map(([k, v]) => ({
                  name: k.replace(/_/g, ' '),
                  value: v.revenue,
                  color: TYPE_COLORS[k] || '#94a3b8',
                }))}
                height={280}
              />
            </ChartCard>

            <ChartCard title="Payment Methods" subtitle="Orders by method">
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

          <ChartCard title="Top Products" subtitle="Highest revenue generators">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No sales yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Product</th>
                      <th className="text-center py-2 px-2">Type</th>
                      <th className="text-right py-2 px-2">Units</th>
                      <th className="text-right py-2 px-2">Revenue</th>
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

          <ChartCard title="Recent Orders" subtitle="Last 10 orders in range">
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No orders</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-left py-2 px-2">Order ID</th>
                      <th className="text-center py-2 px-2">Status</th>
                      <th className="text-center py-2 px-2">Method</th>
                      <th className="text-right py-2 px-2">Total</th>
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
