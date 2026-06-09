'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const USD_RATE = 320

export default function ChannelsPage() {
  const [data, setData] = useState<any>({ meta: {}, tiktok: {}, influencer: {} })
  const [monthly, setMonthly] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [metaRes, tiktokRes, infRes] = await Promise.all([
        supabase.from('meta_campaigns').select('month,spend,leads,clicks,cpc,cpm,impressions'),
        supabase.from('tiktok_campaigns').select('month,spend,clicks,cpm,impressions,video_views'),
        supabase.from('influencer_log').select('month,cost,leads,reach'),
      ])

      const agg = (rows: any[], key: string, fn: (r: any) => number) =>
        (rows || []).reduce((sum, r) => sum + fn(r), 0)

      const metaRows = metaRes.data || []
      const tiktokRows = tiktokRes.data || []
      const infRows = infRes.data || []

      const metaSpend = agg(metaRows, 'spend', r => r.spend)
      const metaLeads = agg(metaRows, 'leads', r => r.leads)
      const metaClicks = agg(metaRows, 'clicks', r => r.clicks)

      const tiktokSpend = agg(tiktokRows, 'spend', r => r.spend * USD_RATE)
      const tiktokClicks = agg(tiktokRows, 'clicks', r => r.clicks)
      const tiktokViews = agg(tiktokRows, 'video_views', r => r.video_views)

      const infSpend = agg(infRows, 'cost', r => r.cost)
      const infLeads = agg(infRows, 'leads', r => r.leads)
      const infReach = agg(infRows, 'reach', r => r.reach)

      setData({
        meta: {
          spend: metaSpend, leads: metaLeads, clicks: metaClicks,
          cpl: metaLeads > 0 ? metaSpend / metaLeads : 0
        },
        tiktok: {
          spend: tiktokSpend, clicks: tiktokClicks, video_views: tiktokViews,
          cpl: 0
        },
        influencer: {
          spend: infSpend, leads: infLeads, reach: infReach,
          cpl: infLeads > 0 ? infSpend / infLeads : 0
        },
      })

      // Monthly stacked bar
      const monthMap: Record<string, any> = {}
      metaRows.forEach((r: any) => {
        if (!monthMap[r.month]) monthMap[r.month] = { month: r.month, meta: 0, tiktok: 0, influencer: 0 }
        monthMap[r.month].meta += r.spend
      })
      tiktokRows.forEach((r: any) => {
        if (!monthMap[r.month]) monthMap[r.month] = { month: r.month, meta: 0, tiktok: 0, influencer: 0 }
        monthMap[r.month].tiktok += r.spend * USD_RATE
      })
      infRows.forEach((r: any) => {
        if (!monthMap[r.month]) monthMap[r.month] = { month: r.month, meta: 0, tiktok: 0, influencer: 0 }
        monthMap[r.month].influencer += r.cost
      })
      setMonthly(Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)))
      setLoading(false)
    }
    load()
  }, [])

  const fmtRs = (v: number) =>
    v >= 1000000 ? `Rs.${(v / 1000000).toFixed(2)}M` : `Rs.${(v / 1000).toFixed(0)}K`

  const channels = [
    {
      name: 'Meta Ads', color: '#1F5FA6',
      stats: [
        { label: 'Total Spend', value: fmtRs(data.meta.spend || 0) },
        { label: 'Total Leads', value: (data.meta.leads || 0).toLocaleString() },
        { label: 'Total Clicks', value: (data.meta.clicks || 0).toLocaleString() },
        { label: 'Cost Per Lead', value: data.meta.cpl > 0 ? `Rs.${data.meta.cpl.toFixed(0)}` : '—' },
      ],
      note: 'Primary conversion channel — WhatsApp leads'
    },
    {
      name: 'TikTok Ads', color: '#00B4D8',
      stats: [
        { label: 'Total Spend (LKR)', value: fmtRs(data.tiktok.spend || 0) },
        { label: 'Total Clicks', value: (data.tiktok.clicks || 0).toLocaleString() },
        { label: 'Video Views', value: (data.tiktok.video_views || 0).toLocaleString() },
        { label: 'CPM (LKR equiv)', value: '~Rs.150' },
      ],
      note: 'Awareness channel — 31% cheaper CPM than Meta'
    },
    {
      name: 'Influencers', color: '#1D7A4F',
      stats: [
        { label: 'Total Spend', value: fmtRs(data.influencer.spend || 0) },
        { label: 'Total Leads', value: (data.influencer.leads || 0).toLocaleString() },
        { label: 'Total Reach', value: (data.influencer.reach || 0).toLocaleString() },
        { label: 'Cost Per Lead', value: data.influencer.cpl > 0 ? `Rs.${data.influencer.cpl.toFixed(0)}` : '—' },
      ],
      note: 'Content & trust channel — weekly shoots'
    },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Channel Comparison</h1>
        <p className="text-sm text-slate-500 mt-0.5">Meta vs TikTok vs Influencer — all-time performance</p>
      </div>

      {/* Channel cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {channels.map(ch => (
          <div key={ch.name} className={`card p-5 border-l-4`}
            style={{ borderLeftColor: ch.color }}>
            <h2 className="font-bold text-slate-800 mb-1" style={{ color: ch.color }}>
              {ch.name}
            </h2>
            <p className="text-xs text-slate-400 mb-4">{ch.note}</p>
            <div className="space-y-2.5">
              {ch.stats.map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{s.label}</span>
                  <span className="text-sm font-semibold" style={{ color: ch.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly stacked chart */}
      {monthly.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Monthly Spend by Channel (Rs.)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} />
              <YAxis tickFormatter={v => `Rs.${(v / 1000).toFixed(0)}K`}
                tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => [`Rs.${(v / 1000).toFixed(0)}K`, '']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="meta" name="Meta Ads" stackId="a" fill="#1F5FA6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="tiktok" name="TikTok" stackId="a" fill="#00B4D8" />
              <Bar dataKey="influencer" name="Influencers" stackId="a" fill="#1D7A4F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}