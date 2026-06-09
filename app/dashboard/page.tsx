'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import KPICard from '@/components/ui/KPICard'
import SpendChart from '@/components/charts/SpendChart'
import ChannelDonut from '@/components/charts/ChannelDonut'
import {
  AlertTriangle, CheckCircle, TrendingUp,
  TrendingDown, Minus, Target, Zap, Settings2, PenLine
} from 'lucide-react'
import Link from 'next/link'
import type { Alert, MoMRow } from '@/lib/types'

export default function DashboardPage() {
  const [mom, setMom] = useState<MoMRow[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [spendData, setSpendData] = useState<any[]>([])
  const [channelData, setChannelData] = useState<any[]>([])
  const [topCamps, setTopCamps] = useState<any[]>([])
  const [monthBudget, setMonthBudget] = useState<any>(null)
  const [manualSpends, setManualSpends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const currentMonth = new Date().toISOString().slice(0, 7)
    try {
      const [momRes, alertRes, metaRes, tiktokRes, infRes, campRes, budgetRes, manualRes] = await Promise.all([
        supabase.from('mom_meta').select('*').order('month', { ascending: true }),
        supabase.from('alerts').select('*').eq('resolved', false)
          .order('created_at', { ascending: false }).limit(6),
        supabase.from('meta_campaigns').select('month,spend').order('month'),
        supabase.from('tiktok_campaigns').select('month,spend').order('month'),
        supabase.from('influencer_log').select('month,cost').order('month'),
        supabase.from('meta_campaigns')
          .select('campaign_name,spend,cpc,leads,cpm')
          .order('spend', { ascending: false }).limit(8),
        supabase.from('monthly_budget').select('*').eq('month', currentMonth).single(),
        supabase.from('manual_spend').select('*').eq('month', currentMonth),
      ])

      setMom(momRes.data || [])
      setAlerts((alertRes.data || []) as Alert[])
      setTopCamps(campRes.data || [])
      setMonthBudget(budgetRes.data || null)
      setManualSpends(manualRes.data || [])

      // Spend chart data
      const monthMap: Record<string, { meta: number; tiktok: number }> = {}
        ; (metaRes.data || []).forEach((r: any) => {
          if (!monthMap[r.month]) monthMap[r.month] = { meta: 0, tiktok: 0 }
          monthMap[r.month].meta += r.spend
        })
        ; (tiktokRes.data || []).forEach((r: any) => {
          if (!monthMap[r.month]) monthMap[r.month] = { meta: 0, tiktok: 0 }
          monthMap[r.month].tiktok += r.spend * 320
        })
      setSpendData(Object.entries(monthMap).sort().map(([month, v]) => ({ month, ...v })))

      // Channel totals
      const metaTotal = (metaRes.data || []).reduce((s: number, r: any) => s + r.spend, 0)
      const tiktokTotal = (tiktokRes.data || []).reduce((s: number, r: any) => s + r.spend * 320, 0)
      const infTotal = (infRes.data || []).reduce((s: number, r: any) => s + r.cost, 0)
      // Add manual spends to channel totals
      const manualByChannel: Record<string, number> = {}
        ; (manualRes.data || []).forEach((s: any) => {
          manualByChannel[s.channel] = (manualByChannel[s.channel] || 0) + s.amount
        })
      const manualMeta = manualByChannel['Meta Ads'] || 0
      const manualTiktok = manualByChannel['TikTok Ads'] || 0
      const manualInfluencer = manualByChannel['Influencer Shoots'] || 0
      const manualVideo = manualByChannel['Video Campaign'] || 0
      const manualOther = manualByChannel['Tech & Other'] || 0
      const manualTotal = Object.values(manualByChannel).reduce((s, v) => s + v, 0)

      setManualSpends(manualRes.data || [])
      setChannelData([
        { name: 'Meta Ads', value: metaTotal + manualMeta, color: '#1F5FA6' },
        { name: 'TikTok', value: tiktokTotal + manualTiktok, color: '#00B4D8' },
        { name: 'Influencers', value: infTotal + manualInfluencer, color: '#1D7A4F' },
        ...(manualVideo > 0 ? [{ name: 'Video', value: manualVideo, color: '#E07B2A' }] : []),
        ...(manualOther > 0 ? [{ name: 'Other/Tech', value: manualOther, color: '#64748B' }] : []),
      ])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function resolveAlert(id: number) {
    await supabase.from('alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const latest = mom[mom.length - 1]
  const grandTotal = channelData.reduce((s, c) => s + c.value, 0)
  const manualTotal = manualSpends.reduce((s: number, m: any) => s + m.amount, 0)
  const budget = monthBudget?.budget || 0
  const budgetPct = budget > 0 ? Math.min((grandTotal / budget) * 100, 100) : 0

  const fmtRs = (v: number) =>
    v >= 1000000 ? `Rs. ${(v / 1000000).toFixed(2)}M` :
      v >= 1000 ? `Rs. ${(v / 1000).toFixed(0)}K` : `Rs. ${v?.toFixed(0) || 0}`

  const ChangeIcon = ({ val, inverse }: { val: number | null; inverse?: boolean }) => {
    if (val === null || val === undefined) return <Minus size={13} className="text-slate-400" />
    const good = inverse ? val < 0 : val > 0
    return good
      ? <TrendingUp size={13} className="text-green-500" />
      : <TrendingDown size={13} className="text-red-500" />
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Overview Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Marketing performance at a glance
            {latest ? ` — latest: ${latest.month}` : ' — upload CSVs to populate'}
          </p>
        </div>
      </div>

      {/* ── BUDGET PROGRESS BAR ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">
              {monthBudget
                ? `${monthBudget.month} Budget — ${fmtRs(budget)}`
                : 'Monthly Budget'}
            </span>
            {!monthBudget && (
              <Link href="/budget"
                className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700
                           border border-amber-200 font-medium hover:bg-amber-200">
                ⚠ Set budget →
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">
              Spent: <strong className="text-slate-800">{fmtRs(grandTotal)}</strong>
            </span>
            {budget > 0 && (
              <span className="text-slate-500">
                Remaining: <strong className={
                  budgetPct > 95 ? 'text-red-600' :
                    budgetPct > 80 ? 'text-amber-600' : 'text-green-600'
                }>{fmtRs(Math.max(budget - grandTotal, 0))}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-3 rounded-full transition-all duration-700
            ${budgetPct > 95 ? 'bg-red-500' :
              budgetPct > 80 ? 'bg-amber-500' : 'bg-[#1F5FA6]'}`}
            style={{ width: budget > 0 ? `${budgetPct}%` : '0%' }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-400">
          <span>{budget > 0 ? `${budgetPct.toFixed(1)}% used` : 'No budget set for this month'}</span>
          {budget > 0 && <span>{fmtRs(budget)} total</span>}
        </div>

        {/* Per-channel budget vs spent */}
        {monthBudget && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
            {[
              { label: 'Meta Ads', budget: monthBudget.meta_budget, spent: channelData.find(c => c.name === 'Meta Ads')?.value || 0, color: '#1F5FA6' },
              { label: 'TikTok', budget: monthBudget.tiktok_budget, spent: channelData.find(c => c.name === 'TikTok')?.value || 0, color: '#00B4D8' },
              { label: 'Influencers', budget: monthBudget.influencer_budget, spent: channelData.find(c => c.name === 'Influencers')?.value || 0, color: '#1D7A4F' },
              { label: 'Video', budget: monthBudget.video_budget, spent: 0, color: '#E07B2A' },
              { label: 'Other/Tech', budget: monthBudget.other_budget, spent: 0, color: '#64748B' },
            ].filter(c => c.budget > 0).map(ch => {
              const pct = ch.budget > 0 ? Math.min((ch.spent / ch.budget) * 100, 100) : 0
              return (
                <div key={ch.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">{ch.label}</span>
                    <span className="text-slate-400">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: ch.color }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span style={{ color: ch.color }} className="font-medium">
                      {fmtRs(ch.spent)}
                    </span>
                    <span className="text-slate-400">/ {fmtRs(ch.budget)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Ad Spend"
          value={fmtRs(latest?.total_spend || 0)}
          sub={latest ? `Meta — ${latest.month}` : 'No data yet'}
          change={latest?.spend_pct_change}
          color="navy" />
        <KPICard
          label="Avg CPC"
          value={latest ? `Rs. ${latest.avg_cpc?.toFixed(2)}` : '—'}
          sub={latest
            ? latest.avg_cpc > 15 ? '⚠ Above Rs.15 target'
              : '✓ Below Rs.15 target' : 'Upload data to see'}
          change={latest?.cpc_pct_change}
          color={!latest ? 'blue' : latest.avg_cpc > 15 ? 'red' : 'green'} />
        <KPICard
          label="Total Leads"
          value={(latest?.total_leads || 0).toLocaleString()}
          sub={latest ? 'WhatsApp conversations' : 'No data yet'}
          change={latest?.prev_leads && latest?.total_leads
            ? ((latest.total_leads - latest.prev_leads) / latest.prev_leads * 100)
            : null}
          color="green" />
        <KPICard
          label="Avg CPM"
          value={latest ? `Rs. ${latest.avg_cpm?.toFixed(0)}` : '—'}
          sub={latest
            ? latest.avg_cpm > 220 ? '⚠ Above Rs.220'
              : '✓ Within range' : 'Upload data to see'}
          color="amber" />
      </div>

      {/* ── SPEND CHART + DONUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Ad Spend Trend</h2>
            <Link href="/monthly" className="text-xs text-blue-600 hover:underline">
              Full analysis →
            </Link>
          </div>
          {spendData.length > 0
            ? <SpendChart data={spendData} />
            : <div className="h-[280px] flex items-center justify-center text-slate-300 text-sm">
              Upload Meta CSV to see spend trend
            </div>
          }
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Budget by Channel</h2>
            <Link href="/channels" className="text-xs text-blue-600 hover:underline">
              Compare →
            </Link>
          </div>
          {grandTotal > 0
            ? <ChannelDonut data={channelData} />
            : <div className="h-[260px] flex items-center justify-center text-slate-300 text-sm">
              No channel data yet
            </div>
          }
        </div>
      </div>

      {/* ── MOM TABLE ── */}
      {mom.length >= 2 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Month-on-Month Summary</h2>
            <Link href="/monthly" className="text-xs text-blue-600 hover:underline">Full table →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="text-right">Spend</th>
                  <th className="text-right">vs Prev</th>
                  <th className="text-right">Avg CPC</th>
                  <th className="text-right">CPC Change</th>
                  <th className="text-right">Leads</th>
                  <th className="text-right">Impressions</th>
                </tr>
              </thead>
              <tbody>
                {mom.slice(-5).map((r, i) => {
                  const isLatest = i === mom.slice(-5).length - 1
                  return (
                    <tr key={i} className={isLatest ? 'bg-blue-50 font-semibold' : ''}>
                      <td className="font-medium text-slate-700">{r.month}</td>
                      <td className="text-right font-semibold text-blue-700">{fmtRs(r.total_spend)}</td>
                      <td className="text-right">
                        <span className={`flex items-center justify-end gap-1 text-xs font-medium
                          ${r.spend_pct_change === null ? 'text-slate-400' :
                            r.spend_pct_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <ChangeIcon val={r.spend_pct_change} />
                          {r.spend_pct_change !== null
                            ? `${Math.abs(r.spend_pct_change).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className={`text-right font-medium
                        ${r.avg_cpc > 15 ? 'text-red-600' :
                          r.avg_cpc < 12 ? 'text-green-600' : 'text-amber-600'}`}>
                        Rs.{r.avg_cpc?.toFixed(2)}
                      </td>
                      <td className="text-right">
                        <span className={`flex items-center justify-end gap-1 text-xs font-medium
                          ${r.cpc_pct_change === null ? 'text-slate-400' :
                            r.cpc_pct_change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <ChangeIcon val={r.cpc_pct_change} inverse />
                          {r.cpc_pct_change !== null
                            ? `${Math.abs(r.cpc_pct_change).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="text-right text-green-700 font-medium">
                        {(r.total_leads || 0).toLocaleString()}
                      </td>
                      <td className="text-right text-slate-500">
                        {(r.total_impressions || 0).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS + ALERTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Target size={15} className="text-blue-500" />
              Top Campaigns by Spend
            </h2>
            <Link href="/campaigns" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          {topCamps.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No campaign data — upload Meta CSV from the Upload Data page
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th className="text-right">Spend</th>
                    <th className="text-right">CPC</th>
                    <th className="text-right">Leads</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topCamps.map((c, i) => {
                    const good = c.cpc < 12
                    const bad = c.cpc > 15
                    const waste = c.leads === 0 && c.spend > 30000
                    return (
                      <tr key={i}>
                        <td className="max-w-[140px] truncate font-medium text-slate-700"
                          title={c.campaign_name}>{c.campaign_name}</td>
                        <td className="text-right font-semibold text-blue-700">
                          Rs.{(c.spend / 1000).toFixed(0)}K
                        </td>
                        <td className={`text-right font-medium
                          ${bad ? 'text-red-600' : good ? 'text-green-600' : 'text-amber-600'}`}>
                          Rs.{c.cpc?.toFixed(2)}
                        </td>
                        <td className="text-right text-slate-600">{c.leads || 0}</td>
                        <td className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${waste ? 'bg-red-100 text-red-700' :
                              good ? 'bg-green-100 text-green-700' :
                                bad ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                            {waste ? '⚠ No leads' : good ? '✓ Good' : bad ? '↑ High CPC' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              Smart Alerts
              {alerts.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
                  {alerts.length}
                </span>
              )}
            </h2>
          </div>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <CheckCircle size={28} className="text-green-400" />
              <p className="text-sm font-medium text-slate-600">All clear</p>
              <p className="text-xs text-slate-400">No active alerts right now</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-sm
                    ${alert.severity === 'critical' ? 'badge-critical' :
                      alert.severity === 'high' ? 'badge-high' : 'badge-medium'}`}>
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs uppercase tracking-wide mb-0.5">
                      {alert.alert_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs leading-relaxed opacity-80">{alert.message}</div>
                  </div>
                  <button onClick={() => resolveAlert(alert.id!)}
                    className="shrink-0 text-xs underline opacity-50 hover:opacity-100">
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MANUAL SPEND THIS MONTH ── */}
      {manualSpends.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <PenLine size={15} className="text-purple-500" />
              Manual Spend Entries — This Month
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                {manualSpends.length} entries
              </span>
            </h2>
            <Link href="/budget" className="text-xs text-blue-600 hover:underline">
              Manage →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {manualSpends.map((s: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <div className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background:
                              s.channel === 'Meta Ads' ? '#1F5FA6' :
                                s.channel === 'TikTok Ads' ? '#00B4D8' :
                                  s.channel === 'Influencer Shoots' ? '#1D7A4F' :
                                    s.channel === 'Video Campaign' ? '#E07B2A' : '#64748B'
                          }} />
                        {s.channel}
                      </span>
                    </td>
                    <td className="text-slate-600">{s.description}</td>
                    <td className="text-right font-semibold text-blue-700">
                      Rs.{s.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-semibold">
                  <td colSpan={2} className="text-slate-700">Total Manual Spend</td>
                  <td className="text-right text-blue-700">
                    Rs.{manualTotal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CHANNEL SUMMARY ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Zap size={15} className="text-amber-500" />
            Channel Performance Summary
          </h2>
          <Link href="/channels" className="text-xs text-blue-600 hover:underline">
            Full comparison →
          </Link>
        </div>
        {grandTotal > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {channelData.map(ch => (
              <div key={ch.name} className="p-4 rounded-xl bg-slate-50 border-l-4"
                style={{ borderLeftColor: ch.color }}>
                <div className="font-semibold text-sm mb-1" style={{ color: ch.color }}>
                  {ch.name}
                </div>
                <div className="text-2xl font-bold text-slate-800">{fmtRs(ch.value)}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {((ch.value / grandTotal) * 100).toFixed(1)}% of total spend
                </div>
                <div className="mt-2 w-full h-1.5 bg-white rounded-full overflow-hidden">
                  <div className="h-1.5 rounded-full"
                    style={{ width: `${(ch.value / grandTotal) * 100}%`, background: ch.color }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-300 text-sm">
            Upload Meta and TikTok CSVs from the Upload Data page to see channel breakdown
          </div>
        )}
      </div>

    </div>
  )
}