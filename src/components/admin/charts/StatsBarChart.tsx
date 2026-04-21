'use client'

import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from 'recharts'

interface Series {
  key: string
  name: string
  color: string
}

interface Props {
  data: any[]
  xKey: string
  series: Series[]
  height?: number
  layout?: 'vertical' | 'horizontal'
  stacked?: boolean
  showLegend?: boolean
}

export default function StatsBarChart({
  data, xKey, series, height = 280, layout = 'vertical', stacked = false, showLegend = false,
}: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No data
      </div>
    )
  }
  const horizontal = layout === 'horizontal'
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 10, right: 16, bottom: 0, left: horizontal ? 0 : -16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={140} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
            </>
          )}
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 12,
              padding: 8,
            }}
            cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          />
          {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map(s => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              stackId={stacked ? 'a' : undefined}
              radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
