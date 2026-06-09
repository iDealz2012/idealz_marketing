'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Save, TrendingUp } from 'lucide-react'

interface Influencer {
  id?: number
  month: string
  influencer_name: string
  platform: string
  cost: number
  reach: number
  leads: number
  shoot_type?: string
  notes?: string
}

// Generate 3 months ahead + 36 months back
function getMonthOptions() {
  const months = []
  const now = new Date()
  // 3 future months first
  for (let i = 3; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' }) + ' (upcoming)'
    months.push({ value, label })
  }
  // Current + 36 months back
  for (let i = 0; i < 36; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    months.push({ value, label })
  }
  return months
}

const MONTH_OPTIONS = getMonthOptions()
const CURRENT_MONTH = new Date().toISOString().slice(0, 7)

const PLATFORMS = [
  'Instagram',
  'Instagram Reels',
  'Instagram Stories',
  'TikTok',
  'YouTube',
  'YouTube Shorts',
  'Facebook',
  'Facebook Reels',
  'Twitter / X',
  'Snapchat',
  'LinkedIn',
  'Pinterest',
  'WhatsApp Status',
]

const SHOOT_TYPES = ['Standard', 'Macro', 'Micro', 'Story only', 'Reel only', 'Multi-platform']

const EMPTY = (): Influencer => ({
  month: CURRENT_MONTH,
  influencer_name: '',
  platform: 'Instagram',
  cost: 0,
  reach: 0,
  leads: 0,
  shoot_type: 'Standard',
  notes: '',
})

export default function InfluencersPage() {
  const [rows, setRows] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Influencer>(EMPTY())
  const [saving, setSaving] = useState(false)
  const [filterMonth, setFilterMonth] = useState('all')
  const [availMonths, setAvailMonths] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase
      .from('influencer_log')
      .select('*')
      .order('created_at', { ascending: false })
    const all = (data || []) as Influencer[]
    setRows(all)
    // Get unique months that have data
    const months = Array.from(new Set(all.map(r => r.month))).sort().reverse()
    setAvailMonths(months)
    setLoading(false)
  }

  const set = (key: keyof Influencer, val: any) =>
    setForm(p => ({ ...p, [key]: val }))

  async function handleSave() {
    if (!form.influencer_name || !form.cost) return
    setSaving(true)
    if (form.id) {
      await supabase.from('influencer_log').update({ ...form }).eq('id', form.id)
    } else {
      await supabase.from('influencer_log').insert({ ...form })
    }
    setSaving(false)
    setForm(EMPTY())
    setShowForm(false)
    loadData()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this shoot entry?')) return
    await supabase.from('influencer_log').delete().eq('id', id)
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function handleEdit(row: Influencer) {
    setForm(row)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── FILTERED ROWS ─────────────────────────────────────────
  const filtered = filterMonth === 'all'
    ? rows
    : rows.filter(r => r.month === filterMonth)

  // Sort by cost per lead (best ROI first)
  const sorted = [...filtered].sort((a, b) => {
    const aScore = a.leads > 0 ? a.cost / a.leads : 999999
    const bScore = b.leads > 0 ? b.cost / b.leads : 999999
    return aScore - bScore
  })

  // ── SUMMARY STATS ─────────────────────────────────────────
  const totalSpend = filtered.reduce((s, r) => s + r.cost, 0)
  const totalLeads = filtered.reduce((s, r) => s + r.leads, 0)
  const totalReach = filtered.reduce((s, r) => s + r.reach, 0)
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0

  const fmtRs = (v: number) =>
    v >= 1000000 ? `Rs.${(v / 1000000).toFixed(2)}M` :
      v >= 1000 ? `Rs.${(v / 1000).toFixed(0)}K` : `Rs.${v}`

  const monthLabel = (m: string) =>
    MONTH_OPTIONS.find(o => o.value === m)?.label || m

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Influencer ROI Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every shoot ranked by cost per lead — best ROI at top
          </p>
        </div>
        <button onClick={() => { setForm(EMPTY()); setShowForm(true) }}
          className="btn-primary">
          <Plus size={15} /> Add Shoot
        </button>
      </div>

      {/* ── ADD / EDIT FORM ── */}
      {showForm && (
        <div className="card p-5 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">
              {form.id ? 'Edit Shoot Entry' : 'Add New Shoot'}
            </h2>
            <button onClick={() => { setShowForm(false); setForm(EMPTY()) }}
              className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Month — dropdown picker, no typos */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Month
              </label>
              <select value={form.month} onChange={e => set('month', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                           bg-white">
                {MONTH_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Influencer name */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Influencer Name
              </label>
              <input type="text" placeholder="@username or full name"
                value={form.influencer_name}
                onChange={e => set('influencer_name', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>

            {/* Platform */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Platform</label>
              <select value={form.platform} onChange={e => set('platform', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                           bg-white">
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* Cost */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Cost (Rs.)
              </label>
              <input type="number" placeholder="e.g. 60000"
                value={form.cost || ''}
                onChange={e => set('cost', +e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>

            {/* Reach */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Reach (views/impressions)
              </label>
              <input type="number" placeholder="e.g. 50000"
                value={form.reach || ''}
                onChange={e => set('reach', +e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>

            {/* Leads */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Leads Generated (WhatsApp)
              </label>
              <input type="number" placeholder="e.g. 12"
                value={form.leads || ''}
                onChange={e => set('leads', +e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>

            {/* Shoot type */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Shoot Type
              </label>
              <select value={form.shoot_type} onChange={e => set('shoot_type', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                           bg-white">
                {SHOOT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Notes (optional)
              </label>
              <input type="text" placeholder="e.g. iPhone 17 Pro Max unboxing — 3 reels + story"
                value={form.notes || ''}
                onChange={e => set('notes', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
          </div>

          {/* Live CPL preview */}
          {form.cost > 0 && form.leads > 0 && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-green-50
                            border border-green-200 rounded-lg">
              <TrendingUp size={15} className="text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Cost per lead: Rs.{(form.cost / form.leads).toFixed(0)}
                {form.cost / form.leads < 1000
                  ? ' — Excellent ROI ✓'
                  : form.cost / form.leads < 5000
                    ? ' — Good ROI'
                    : ' — Review needed'}
              </span>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave}
              disabled={saving || !form.influencer_name || !form.cost}
              className="btn-primary disabled:opacity-50">
              <Save size={15} />
              {saving ? 'Saving...' : form.id ? 'Update Entry' : 'Save Entry'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY()) }}
              className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── MONTH FILTER ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-slate-500">Filter by month:</span>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterMonth('all')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all
              ${filterMonth === 'all'
                ? 'bg-[#0A2342] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All Time
          </button>
          {availMonths.map(m => (
            <button key={m}
              onClick={() => setFilterMonth(m)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all
                ${filterMonth === m
                  ? 'bg-[#1F5FA6] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {monthLabel(m)}
            </button>
          ))}
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: filterMonth === 'all' ? 'All-time Spend' : `${monthLabel(filterMonth)} Spend`,
            value: fmtRs(totalSpend), color: 'text-[#1F5FA6]'
          },
          {
            label: 'Total Leads',
            value: totalLeads.toLocaleString(), color: 'text-[#1D7A4F]'
          },
          {
            label: 'Avg Cost / Lead',
            value: avgCPL > 0 ? fmtRs(avgCPL) : '—', color: 'text-[#E07B2A]'
          },
          {
            label: 'Total Reach',
            value: totalReach >= 1000000
              ? `${(totalReach / 1000000).toFixed(1)}M`
              : totalReach >= 1000
                ? `${(totalReach / 1000).toFixed(0)}K`
                : totalReach.toString(),
            color: 'text-[#7F4FD4]'
          },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── TABLE ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 text-sm">
            {filterMonth === 'all'
              ? `All Shoots — ${sorted.length} entries`
              : `${monthLabel(filterMonth)} — ${sorted.length} shoots`}
          </h2>
          <span className="text-xs text-slate-400">Sorted by best ROI first</span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Influencer</th>
                <th>Month</th>
                <th>Platform</th>
                <th>Type</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Reach</th>
                <th className="text-right">Leads</th>
                <th className="text-right">Cost/Lead</th>
                <th className="text-right">ROI</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center text-slate-400 py-10">
                    {filterMonth === 'all'
                      ? 'No shoots yet — click Add Shoot to get started'
                      : `No shoots recorded for ${monthLabel(filterMonth)}`}
                  </td>
                </tr>
              ) : (
                sorted.map((r, i) => {
                  const cpl = r.leads > 0 ? r.cost / r.leads : null
                  const roi = cpl === null ? 'No data' :
                    cpl < 1000 ? 'Excellent' :
                      cpl < 5000 ? 'Good' :
                        cpl < 15000 ? 'Average' : 'Poor'
                  const roiColor =
                    roi === 'Excellent' ? 'bg-green-100 text-green-700' :
                      roi === 'Good' ? 'bg-blue-100 text-blue-700' :
                        roi === 'Average' ? 'bg-amber-100 text-amber-700' :
                          roi === 'Poor' ? 'bg-red-100 text-red-600' :
                            'bg-slate-100 text-slate-500'
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className={`font-bold text-sm
                          ${i === 0 ? 'text-yellow-500' :
                            i === 1 ? 'text-slate-400' :
                              i === 2 ? 'text-amber-600' : 'text-slate-300'}`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className="font-semibold text-slate-700">{r.influencer_name}</td>
                      <td>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {monthLabel(r.month)}
                        </span>
                      </td>
                      <td className="text-slate-500 text-xs">{r.platform}</td>
                      <td className="text-slate-400 text-xs">{r.shoot_type || '—'}</td>
                      <td className="text-right font-semibold text-blue-700">
                        Rs.{r.cost.toLocaleString()}
                      </td>
                      <td className="text-right text-slate-500">
                        {r.reach ? (r.reach >= 1000 ? `${(r.reach / 1000).toFixed(0)}K` : r.reach) : '—'}
                      </td>
                      <td className="text-right font-semibold text-green-700">{r.leads}</td>
                      <td className="text-right font-medium text-slate-700">
                        {cpl !== null ? `Rs.${cpl.toFixed(0)}` : '—'}
                      </td>
                      <td className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roiColor}`}>
                          {roi}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(r)}
                            className="text-xs text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => r.id && handleDelete(r.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}