'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'

interface SpendChartProps {
  data: { month: string; meta: number; tiktok: number }[]
}

const fmt = (v: number) =>
  v >= 1000000 ? `Rs.${(v/1000000).toFixed(1)}M` :
  v >= 1000    ? `Rs.${(v/1000).toFixed(0)}K` :
  `Rs.${v}`

export default function SpendChart({ data }: SpendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }}
               tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#64748B' }}
               tickLine={false} axisLine={false} width={80} />
        <Tooltip
          formatter={(value: number, name: string) => [fmt(value), name]}
          contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="meta" name="Meta Ads (Rs.)"
              stroke="#1F5FA6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="tiktok" name="TikTok (LKR equiv.)"
              stroke="#00B4D8" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }}
              strokeDasharray="5 3" />
        <ReferenceLine y={3000000} stroke="#E07B2A" strokeDasharray="4 2"
                       label={{ value: 'Budget Rs.3M', fill: '#E07B2A', fontSize: 11 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
