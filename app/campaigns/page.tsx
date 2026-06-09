'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, ArrowUp, ArrowDown } from 'lucide-react'

type SortKey = 'spend' | 'cpc' | 'cpm' | 'leads' | 'clicks' | 'ctr'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [filtered,  setFiltered]  = useState<any[]>([])
  const [months,    setMonths]    = useState<string[]>([])
  const [selMonth,  setSelMonth]  = useState('all')
  const [search,    setSearch]    = useState('')
  const [sortKey,   setSortKey]   = useState<SortKey>('spend')
  const [sortAsc,   setSortAsc]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('meta_campaigns').select('*').order('spend', { ascending: false })
      .then(({ data }) => {
        const rows = data || []
        setCampaigns(rows)
        setFiltered(rows)
        setMonths([...new Set(rows.map((r: any) => r.month))].sort().reverse())
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let rows = [...campaigns]
    if (selMonth !== 'all') rows = rows.filter(r => r.month === selMonth)
    if (search) rows = rows.filter(r =>
      r.campaign_name.toLowerCase().includes(search.toLowerCase()))
    rows.sort((a, b) => {
      const av = a[sortKey] || 0, bv = b[sortKey] || 0
      return sortAsc ? av - bv : bv - av
    })
    setFiltered(rows)
  }, [campaigns, selMonth, search, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
      : <ArrowDown size={12} className="opacity-20" />

  const fmtRs = (v: number) =>
    v >= 1000 ? `Rs.${(v/1000).toFixed(0)}K` : `Rs.${v?.toFixed(0) || 0}`

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Campaign Detail</h1>
        <p className="text-sm text-slate-500 mt-0.5">All Meta campaigns — click column headers to sort</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Search campaigns..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-60
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        </div>
        <select
          value={selMonth} onChange={e => setSelMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">All months</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="text-sm text-slate-500 flex items-center">
          {filtered.length} campaigns
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Month</th>
                <th className="text-right cursor-pointer hover:bg-navy/80"
                    onClick={() => toggleSort('spend')}>
                  <span className="flex items-center justify-end gap-1">
                    Spend <SortIcon k="spend" /></span>
                </th>
                <th className="text-right cursor-pointer hover:bg-navy/80"
                    onClick={() => toggleSort('cpc')}>
                  <span className="flex items-center justify-end gap-1">
                    CPC <SortIcon k="cpc" /></span>
                </th>
                <th className="text-right cursor-pointer hover:bg-navy/80"
                    onClick={() => toggleSort('cpm')}>
                  <span className="flex items-center justify-end gap-1">
                    CPM <SortIcon k="cpm" /></span>
                </th>
                <th className="text-right cursor-pointer hover:bg-navy/80"
                    onClick={() => toggleSort('clicks')}>
                  <span className="flex items-center justify-end gap-1">
                    Clicks <SortIcon k="clicks" /></span>
                </th>
                <th className="text-right cursor-pointer hover:bg-navy/80"
                    onClick={() => toggleSort('leads')}>
                  <span className="flex items-center justify-end gap-1">
                    Leads <SortIcon k="leads" /></span>
                </th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const cpcStatus = c.cpc > 15 ? 'danger' : c.cpc < 12 ? 'good' : 'warn'
                return (
                  <tr key={i}>
                    <td className="max-w-[200px] font-medium text-slate-700 truncate"
                        title={c.campaign_name}>{c.campaign_name}</td>
                    <td className="text-slate-500">{c.month}</td>
                    <td className="text-right font-semibold text-blue-700">{fmtRs(c.spend)}</td>
                    <td className={`text-right font-medium
                      ${cpcStatus === 'danger' ? 'text-red-600' :
                        cpcStatus === 'good'   ? 'text-green-600' : 'text-amber-600'}`}>
                      Rs.{c.cpc?.toFixed(2)}
                    </td>
                    <td className={`text-right ${c.cpm > 220 ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                      Rs.{c.cpm?.toFixed(0)}
                    </td>
                    <td className="text-right text-slate-600">{(c.clicks || 0).toLocaleString()}</td>
                    <td className="text-right font-medium text-green-700">{c.leads || 0}</td>
                    <td className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${c.leads === 0 && c.spend > 30000
                          ? 'bg-red-100 text-red-700'
                          : cpcStatus === 'good'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'}`}>
                        {c.leads === 0 && c.spend > 30000 ? '⚠ No leads'
                          : cpcStatus === 'good' ? '✓ Good CPC'
                          : cpcStatus === 'danger' ? '↑ High CPC'
                          : 'Normal'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
