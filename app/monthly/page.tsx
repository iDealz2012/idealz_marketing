'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'
import type { MoMRow } from '@/lib/types'

function Change({ val }: { val: number | null }) {
  if (val === null || val === undefined) return <span className="change-none">—</span>
  const positive = val <= 0  // for CPC, down is good — handled by caller
  return (
    <span className={val < 0 ? 'change-up' : val > 0 ? 'change-down' : 'change-none'}>
      {val > 0 ? '↑' : val < 0 ? '↓' : '—'} {Math.abs(val).toFixed(1)}%
    </span>
  )
}

function CPCChange({ val }: { val: number | null }) {
  if (val === null || val === undefined) return <span className="change-none">—</span>
  return (
    <span className={val < 0 ? 'change-up' : val > 0 ? 'change-down' : 'change-none'}>
      {val > 0 ? '↑' : val < 0 ? '↓' : '—'} {Math.abs(val).toFixed(1)}%
    </span>
  )
}

export default function MonthlyPage() {
  const [rows, setRows] = useState<MoMRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'table' | 'spend' | 'cpc'>('table')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('mom_meta').select('*')
      .order('month', { ascending: true })
      .then(({ data }) => { setRows((data || []) as MoMRow[]); setLoading(false) })
  }, [])

  const fmtRs = (v: number) =>
    v >= 1000000 ? `Rs.${(v/1000000).toFixed(2)}M` :
    `Rs.${(v/1000).toFixed(0)}K`

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Monthly Analysis</h1>
        <p className="text-sm text-slate-500 mt-0.5">Month-on-month performance comparison — Meta Ads</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {[['table','Table View'],['spend','Spend Trend'],['cpc','CPC Trend']].map(([v,l]) => (
          <button key={v}
            onClick={() => setActiveTab(v as any)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${activeTab === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Table view */}
      {activeTab === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="text-right">Total Spend</th>
                  <th className="text-right">vs Prev Month</th>
                  <th className="text-right">Avg CPC</th>
                  <th className="text-right">CPC Change</th>
                  <th className="text-right">Total Leads</th>
                  <th className="text-right">Impressions</th>
                  <th className="text-right">Avg CPM</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={i === rows.length - 1 ? 'font-semibold bg-blue-50' : ''}>
                    <td className="font-medium text-slate-700">{r.month}</td>
                    <td className="text-right font-semibold text-blue-700">{fmtRs(r.total_spend)}</td>
                    <td className="text-right"><Change val={r.spend_pct_change} /></td>
                    <td className={`text-right font-medium
                      ${r.avg_cpc > 15 ? 'text-red-600' : r.avg_cpc < 12 ? 'text-green-600' : 'text-amber-600'}`}>
                      Rs.{r.avg_cpc?.toFixed(2)}
                    </td>
                    <td className="text-right"><CPCChange val={r.cpc_pct_change} /></td>
                    <td className="text-right text-green-700 font-medium">
                      {(r.total_leads || 0).toLocaleString()}
                    </td>
                    <td className="text-right text-slate-500">
                      {(r.total_impressions || 0).toLocaleString()}
                    </td>
                    <td className="text-right text-slate-500">Rs.{r.avg_cpm?.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spend chart */}
      {activeTab === 'spend' && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Ad Spend — Meta Campaigns</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rows} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} />
              <YAxis tickFormatter={v => `Rs.${(v/1000).toFixed(0)}K`}
                     tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => [`Rs.${(v/1000).toFixed(0)}K`, 'Spend']}
                       contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Bar dataKey="total_spend" name="Total Spend" fill="#1F5FA6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* CPC chart */}
      {activeTab === 'cpc' && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Average CPC Trend — Lower is Better</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={rows} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} />
              <YAxis tickFormatter={v => `Rs.${v}`}
                     tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => [`Rs.${v}`, 'Avg CPC']}
                       contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Line type="monotone" dataKey="avg_cpc" name="Avg CPC"
                    stroke="#E07B2A" strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Target: Below Rs.12 — Green zone. Above Rs.15 — action required.
          </p>
        </div>
      )}
    </div>
  )
}
