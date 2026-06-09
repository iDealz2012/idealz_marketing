'use client'
import {
  PieChart, Pie, Cell, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'

interface ChannelDonutProps {
  data: { name: string; value: number; color: string }[]
}

const fmt = (v: number) =>
  v >= 1000000 ? `Rs.${(v/1000000).toFixed(2)}M` :
  `Rs.${(v/1000).toFixed(0)}K`

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle"
          dominantBaseline="central" fontSize={12} fontWeight={600}>
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

export default function ChannelDonut({ data }: ChannelDonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={100}
             dataKey="value" labelLine={false} label={renderLabel}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => [fmt(v), '']}
                 contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
        <Legend
          formatter={(value, entry: any) => (
            <span style={{ color: '#334155', fontSize: 12 }}>
              {value} <span style={{ color: '#94A3B8' }}>
                ({total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : 0}%)
              </span>
            </span>
          )} />
      </PieChart>
    </ResponsiveContainer>
  )
}
