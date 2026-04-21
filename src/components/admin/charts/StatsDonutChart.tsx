'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface Datum {
  name: string
  value: number
  color: string
}

interface Props {
  data: Datum[]
  height?: number
  innerRadius?: number
  showLegend?: boolean
}

export default function StatsDonutChart({ data, height = 240, innerRadius = 55, showLegend = true }: Props) {
  const total = (data || []).reduce((s, d) => s + (d.value || 0), 0)
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No data
      </div>
    )
  }
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 12,
              padding: 8,
            }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              layout="vertical"
              verticalAlign="middle"
              align="right"
            />
          )}
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius="90%"
            innerRadius={innerRadius}
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
