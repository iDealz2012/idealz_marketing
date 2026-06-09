'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, CheckCircle, Plus, X, AlertTriangle } from 'lucide-react'

// ── DEFAULT CHANNELS ─────────────────────────────────────────
// Generate 3 months ahead + 36 months back
function getMonthOptions() {
  const months: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 3; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months.push({
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' }) + ' (upcoming)'
    })
  }
  for (let i = 0; i < 36; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' })
    })
  }
  return months
}
const MONTH_OPTIONS = getMonthOptions()

const DEFAULT_CHANNELS = [
  { key: 'meta_budget', label: 'Meta Ads', color: '#1F5FA6', removable: false },
  { key: 'tiktok_budget', label: 'TikTok Ads', color: '#00B4D8', removable: false },
  { key: 'influencer_budget', label: 'Influencer Shoots', color: '#1D7A4F', removable: false },
  { key: 'other_budget', label: 'Tech & Other', color: '#64748B', removable: false },
]

const CUSTOM_COLORS = [
  '#7F4FD4', '#C0392B', '#16A085', '#8E44AD', '#D35400',
  '#27AE60', '#2980B9', '#F39C12', '#1ABC9C', '#E91E63',
]

interface CustomChannel {
  label: string
  amount: number
  color: string
}

interface MonthBudget {
  id?: number
  month: string
  budget: number
  meta_budget: number
  tiktok_budget: number
  influencer_budget: number
  video_budget: number
  other_budget: number
  custom_channels?: CustomChannel[]
  channel_notes?: Record<string, string>
  notes?: string
}

interface ManualSpend {
  id?: number
  month: string
  channel: string
  description: string
  amount: number
}

const EMPTY_BUDGET = (): MonthBudget => ({
  month: new Date().toISOString().slice(0, 7),
  budget: 0, meta_budget: 0, tiktok_budget: 0,
  influencer_budget: 0, video_budget: 0, other_budget: 0,
  custom_channels: [], channel_notes: {}, notes: ''
})

const EMPTY_SPEND = (): ManualSpend => ({
  month: new Date().toISOString().slice(0, 7),
  channel: 'Meta Ads', description: '', amount: 0
})

export default function BudgetPage() {
  const [history, setHistory] = useState<MonthBudget[]>([])
  const [form, setForm] = useState<MonthBudget>(EMPTY_BUDGET())
  const [customChannels, setCustomChannels] = useState<CustomChannel[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [channelNotes, setChannelNotes] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [manualSpends, setManualSpends] = useState<ManualSpend[]>([])
  const [spendForm, setSpendForm] = useState<ManualSpend>(EMPTY_SPEND())
  const [showSpendForm, setShowSpendForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'budget' | 'manual'>('budget')
  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: budgets } = await supabase
      .from('monthly_budget').select('*').order('month', { ascending: false })
    setHistory((budgets || []) as MonthBudget[])

    const currentMonth = new Date().toISOString().slice(0, 7)
    const existing = (budgets || []).find((r: any) => r.month === currentMonth)
    if (existing) {
      setForm(existing as MonthBudget)
      setCustomChannels((existing as any).custom_channels || [])
      setChannelNotes((existing as any).channel_notes || {})
    }

    const { data: spends } = await supabase
      .from('manual_spend').select('*').order('created_at', { ascending: false })
    setManualSpends((spends || []) as ManualSpend[])
  }

  const setF = (key: keyof MonthBudget, val: any) => setForm(p => ({ ...p, [key]: val }))
  const setSF = (key: keyof ManualSpend, val: any) => setSpendForm(p => ({ ...p, [key]: val }))

  // ── TOTALS ───────────────────────────────────────────────────
  const defaultTotal = DEFAULT_CHANNELS.reduce((s, c) => s + ((form as any)[c.key] || 0), 0)
  const customTotal = customChannels.reduce((s, c) => s + (c.amount || 0), 0)
  const channelTotal = defaultTotal + customTotal   // Option B total
  const optionA = form.budget                  // Option A total

  // Validation:
  // - Option A (total) must be filled
  // - If Option B channels are filled, they must match Option A
  // - If no channels filled, total-only mode is fine
  const bothSet = optionA > 0 && channelTotal > 0
  const mismatch = bothSet && Math.round(optionA) !== Math.round(channelTotal)
  const canSave = optionA > 0 && !mismatch
  const diff = channelTotal - optionA

  // ── ADD CUSTOM CHANNEL ────────────────────────────────────────
  function addCustomChannel() {
    if (!newLabel.trim()) return
    const color = CUSTOM_COLORS[customChannels.length % CUSTOM_COLORS.length]
    setCustomChannels(prev => [...prev, { label: newLabel.trim(), amount: 0, color }])
    setNewLabel('')
  }

  function updateCustomAmount(idx: number, val: number) {
    setCustomChannels(prev => prev.map((c, i) => i === idx ? { ...c, amount: val } : c))
  }

  function removeCustomChannel(idx: number) {
    setCustomChannels(prev => prev.filter((_, i) => i !== idx))
  }

  // ── SAVE BUDGET ───────────────────────────────────────────────
  async function handleSaveBudget() {
    if (!canSave) return
    setSaving(true)

    // Build clean payload — never send 'id' on insert
    const payload: any = {
      month: form.month,
      budget: optionA,
      meta_budget: form.meta_budget || 0,
      tiktok_budget: form.tiktok_budget || 0,
      influencer_budget: form.influencer_budget || 0,
      video_budget: form.video_budget || 0,
      other_budget: form.other_budget || 0,
      custom_channels: customChannels,
      channel_notes: channelNotes,
      notes: form.notes || '',
    }

    let saveError = null

    if (form.id) {
      // UPDATE existing row
      const { error } = await supabase
        .from('monthly_budget')
        .update(payload)
        .eq('id', form.id)
      saveError = error
    } else {
      // INSERT new row
      const { data, error } = await supabase
        .from('monthly_budget')
        .insert(payload)
        .select()
        .single()
      saveError = error
      if (data) setForm(data as MonthBudget)
    }

    setSaving(false)

    if (saveError) {
      console.error('Save error:', saveError)
      alert('Save failed: ' + saveError.message)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    loadAll()
  }

  // ── SAVE MANUAL SPEND ─────────────────────────────────────────
  async function handleSaveSpend() {
    if (!spendForm.description || spendForm.amount === 0) return
    if (spendForm.id) {
      await supabase.from('manual_spend').update(spendForm).eq('id', spendForm.id)
    } else {
      await supabase.from('manual_spend').insert(spendForm)
    }
    setSpendForm(EMPTY_SPEND()); setShowSpendForm(false); loadAll()
  }

  async function deleteSpend(id: number) {
    await supabase.from('manual_spend').delete().eq('id', id)
    setManualSpends(prev => prev.filter(s => s.id !== id))
  }

  const fmtRs = (v: number) =>
    v >= 1000000 ? `Rs.${(v / 1000000).toFixed(2)}M` : `Rs.${(v / 1000).toFixed(1)}K`

  // All channel labels (default + custom) for manual spend dropdown
  const allChannelLabels = [
    ...DEFAULT_CHANNELS.map(c => c.label),
    ...customChannels.map(c => c.label)
  ]

  // Manual spend by month for analysis
  const spendByMonth: Record<string, Record<string, number>> = {}
  manualSpends.forEach(s => {
    if (!spendByMonth[s.month]) spendByMonth[s.month] = {}
    spendByMonth[s.month][s.channel] = (spendByMonth[s.month][s.channel] || 0) + s.amount
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Budget Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Plan monthly budget + record actual spends</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        {([['budget', 'Monthly Budget Plan'], ['manual', 'Manual Spend Entries']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setActiveTab(v)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${activeTab === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB 1 — MONTHLY BUDGET PLAN
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'budget' && (
        <>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-700">
                {form.id ? `Editing — ${form.month}` : `New Budget — ${form.month}`}
              </h2>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                    <CheckCircle size={16} /> Saved!
                  </span>
                )}
                {form.id && (
                  <button
                    onClick={() => { setForm(EMPTY_BUDGET()); setCustomChannels([]); setChannelNotes({}) }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200
                               text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                    + New Month
                  </button>
                )}
              </div>
            </div>

            {/* Month picker */}
            <div className="mb-6">
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Month</label>
              <select value={form.month}
                onChange={e => setF('month', e.target.value)}
                className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                           bg-white w-48">
                {MONTH_OPTIONS.map((o: any) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* ── OPTION A ── */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[#0A2342] text-white text-xs font-bold
                                flex items-center justify-center shrink-0">A</div>
                <span className="text-sm font-semibold text-slate-700">
                  Total Monthly Budget
                </span>
                <span className="text-xs text-slate-400">(must equal Option B total)</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="number" placeholder="e.g. 3000000"
                  value={form.budget || ''}
                  onChange={e => setF('budget', +e.target.value)}
                  className={`flex-1 px-4 py-3 text-lg font-semibold border rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20
                    ${mismatch ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                {optionA > 0 && (
                  <span className="text-lg font-bold text-[#1F5FA6] shrink-0 w-32">
                    {fmtRs(optionA)}
                  </span>
                )}
              </div>
            </div>

            {/* Match indicator */}
            <div className={`flex items-center gap-2 mb-6 px-4 py-2.5 rounded-lg text-sm font-medium
              ${!bothSet ? 'bg-slate-50 text-slate-400 border border-slate-200' :
                mismatch ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-green-50 text-green-700 border border-green-200'}`}>
              {!bothSet && optionA === 0 ? (
                <span>Enter total budget in Option A above</span>
              ) : !bothSet && channelTotal === 0 ? (
                <span>Option A set — channel split is optional. You can save now.</span>
              ) : mismatch ? (
                <>
                  <AlertTriangle size={15} />
                  <span>
                    Mismatch — Option B total is {diff > 0 ? `Rs.${diff.toLocaleString()} more` : `Rs.${Math.abs(diff).toLocaleString()} less`} than Option A.
                    Adjust channels to match Rs.{optionA.toLocaleString()}.
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Option A = Option B = {fmtRs(optionA)} ✓ Ready to save</span>
                </>
              )}
            </div>

            {/* ── OPTION B ── */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[#1F5FA6] text-white text-xs font-bold
                                flex items-center justify-center shrink-0">B</div>
                <span className="text-sm font-semibold text-slate-700">
                  Budget Split by Channel
                </span>
                <span className={`ml-auto text-sm font-bold ${channelTotal === 0 ? 'text-slate-400' :
                    mismatch ? 'text-red-600' : 'text-green-600'}`}>
                  Total: {channelTotal > 0 ? fmtRs(channelTotal) : '—'}
                </span>
              </div>

              {/* Default channels */}
              <div className="space-y-3 mb-4">
                {DEFAULT_CHANNELS.map(ch => (
                  <div key={ch.key}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: ch.color }} />
                      <span className="text-sm font-medium text-slate-700 w-44 shrink-0">{ch.label}</span>
                      <input type="number" placeholder="0"
                        value={(form as any)[ch.key] || ''}
                        onChange={e => setF(ch.key as keyof MonthBudget, +e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                      <span className="text-xs text-slate-400 w-20 text-right shrink-0 font-medium">
                        {(form as any)[ch.key] > 0 ? fmtRs((form as any)[ch.key]) : ''}
                      </span>
                    </div>
                    {/* Note field — shown below the amount */}
                    <div className="ml-[68px] mt-1.5">
                      <input type="text"
                        placeholder={`Note — e.g. includes Rs.300K video production for ${ch.label}`}
                        value={channelNotes[ch.key] || ''}
                        onChange={e => setChannelNotes(p => ({ ...p, [ch.key]: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border border-dashed border-slate-200
                                   rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400/30
                                   text-slate-500 placeholder:text-slate-300 bg-slate-50/50" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom channels */}
              {customChannels.length > 0 && (
                <div className="space-y-2.5 mb-4 pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Custom Channels
                  </p>
                  {customChannels.map((ch, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: ch.color }} />
                      <span className="text-sm text-slate-600 w-44 shrink-0 truncate">{ch.label}</span>
                      <input type="number" placeholder="0"
                        value={ch.amount || ''}
                        onChange={e => updateCustomAmount(idx, +e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" />
                      <span className="text-xs text-slate-400 w-20 text-right shrink-0">
                        {ch.amount > 0 ? fmtRs(ch.amount) : ''}
                      </span>
                      <button onClick={() => removeCustomChannel(idx)}
                        className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add custom channel */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <input type="text" placeholder="Add custom channel — e.g. Rebranding, App Launch..."
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomChannel()}
                  className="flex-1 px-3 py-2 text-sm border border-dashed border-slate-300
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20
                             focus:border-purple-400 bg-slate-50 placeholder:text-slate-400" />
                <button onClick={addCustomChannel}
                  disabled={!newLabel.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                             text-purple-700 bg-purple-50 border border-purple-200 rounded-lg
                             hover:bg-purple-100 disabled:opacity-40 transition-colors shrink-0">
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Visual breakdown bar */}
            {channelTotal > 0 && (
              <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">Budget Distribution</p>
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
                  {[
                    ...DEFAULT_CHANNELS.filter(c => (form as any)[c.key] > 0).map(c => ({
                      color: c.color, amount: (form as any)[c.key], label: c.label
                    })),
                    ...customChannels.filter(c => c.amount > 0)
                  ].map((ch, i) => (
                    <div key={i} className="h-full transition-all"
                      style={{
                        width: `${(ch.amount / channelTotal * 100).toFixed(1)}%`,
                        background: ch.color,
                        borderRadius: i === 0 ? '6px 0 0 6px' : 'none'
                      }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    ...DEFAULT_CHANNELS.filter(c => (form as any)[c.key] > 0).map(c => ({
                      color: c.color, amount: (form as any)[c.key], label: c.label
                    })),
                    ...customChannels.filter(c => c.amount > 0)
                  ].map((ch, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ch.color }} />
                      <span className="text-slate-500 flex-1 truncate">{ch.label}</span>
                      <span className="font-medium text-slate-700">{fmtRs(ch.amount)}</span>
                      <span className="text-slate-400">
                        {(ch.amount / channelTotal * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-5">
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Notes (optional)</label>
              <input type="text" placeholder="e.g. iPhone 17 launch — increased Meta budget"
                value={form.notes || ''}
                onChange={e => setF('notes', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>

            {/* Save button */}
            <button onClick={handleSaveBudget}
              disabled={saving || !canSave}
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center
                          justify-center gap-2 transition-all
                ${canSave
                  ? 'bg-[#1F5FA6] text-white hover:bg-blue-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
              <Save size={15} />
              {saving ? 'Saving...'
                : mismatch ? `Fix mismatch — Option B is Rs.${Math.abs(diff).toLocaleString()} ${diff > 0 ? 'over' : 'under'}`
                  : !canSave ? 'Enter total budget in Option A to save'
                    : form.id ? `Update ${form.month} Budget` : `Save ${form.month} Budget`}
            </button>
          </div>

          {/* Budget history */}
          {history.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-700">Budget History</h2>
                {form.id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200
                                     px-2 py-1 rounded-lg font-medium">
                      ✏ Editing {form.month}
                    </span>
                    <button
                      onClick={() => {
                        setForm(EMPTY_BUDGET())
                        setCustomChannels([])
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 underline">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="text-right">Total Budget</th>
                      <th className="text-right">Meta</th>
                      <th className="text-right">TikTok</th>
                      <th className="text-right">Influencers</th>
                      <th className="text-right">Video</th>
                      <th className="text-right">Other</th>
                      <th>Notes</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row, i) => {
                      const isEditing = form.id === row.id
                      return (
                        <tr key={i}
                          className={isEditing ? 'bg-amber-50 ring-2 ring-amber-300 ring-inset' : ''}>
                          <td className="font-semibold text-slate-700">{row.month}</td>
                          <td className="text-right font-bold text-blue-700">{fmtRs(row.budget)}</td>
                          <td className="text-right text-slate-600">{row.meta_budget > 0 ? fmtRs(row.meta_budget) : '—'}</td>
                          <td className="text-right text-slate-600">{row.tiktok_budget > 0 ? fmtRs(row.tiktok_budget) : '—'}</td>
                          <td className="text-right text-slate-600">{row.influencer_budget > 0 ? fmtRs(row.influencer_budget) : '—'}</td>
                          <td className="text-right text-slate-600">{row.video_budget > 0 ? fmtRs(row.video_budget) : '—'}</td>
                          <td className="text-right text-slate-600">{row.other_budget > 0 ? fmtRs(row.other_budget) : '—'}</td>
                          <td className="text-slate-400 text-xs max-w-[120px] truncate">{row.notes || '—'}</td>
                          <td>
                            <div className="flex items-center justify-center gap-3">
                              {/* Edit */}
                              <button
                                onClick={() => {
                                  setForm(row)
                                  setCustomChannels((row as any).custom_channels || [])
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium
                                           hover:underline transition-colors">
                                ✏ Edit
                              </button>
                              {/* Delete */}
                              <button
                                onClick={async () => {
                                  if (!confirm(`Delete budget for ${row.month}? This cannot be undone.`)) return
                                  await supabase.from('monthly_budget').delete().eq('id', row.id!)
                                  if (form.id === row.id) {
                                    setForm(EMPTY_BUDGET())
                                    setCustomChannels([])
                                  }
                                  loadAll()
                                }}
                                className="text-xs text-red-400 hover:text-red-600 font-medium
                                           hover:underline transition-colors">
                                🗑 Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB 2 — MANUAL SPEND ENTRIES
      ════════════════════════════════════════════════════════ */}
      {activeTab === 'manual' && (
        <>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-700">Manual Spend Entries</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record any spend not in Meta / TikTok CSV — influencer payments, shoots, agency fees etc.
                </p>
              </div>
              <button onClick={() => setShowSpendForm(true)} className="btn-primary">
                <Plus size={15} /> Add Entry
              </button>
            </div>

            {/* Add / edit form */}
            {showSpendForm && (
              <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-slate-700 text-sm">
                    {spendForm.id ? 'Edit Entry' : 'New Manual Spend Entry'}
                  </h3>
                  <button onClick={() => { setShowSpendForm(false); setSpendForm(EMPTY_SPEND()) }}
                    className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Month</label>
                    <select value={spendForm.month}
                      onChange={e => setSF('month', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                                 focus:outline-none bg-white">
                      {MONTH_OPTIONS.map((o: any) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Channel</label>
                    <select value={spendForm.channel} onChange={e => setSF('channel', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
                      {allChannelLabels.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Description</label>
                    <input type="text" placeholder="e.g. Influencer @username shoot payment"
                      value={spendForm.description} onChange={e => setSF('description', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Amount (Rs.)</label>
                    <input type="number" placeholder="e.g. 60000"
                      value={spendForm.amount || ''} onChange={e => setSF('amount', +e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                  </div>
                </div>
                <button onClick={handleSaveSpend}
                  disabled={!spendForm.description || spendForm.amount === 0}
                  className="btn-primary disabled:opacity-50">
                  <Save size={14} /> Save Entry
                </button>
              </div>
            )}

            {manualSpends.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No manual entries yet — click Add Entry to record a spend
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th><th>Channel</th><th>Description</th>
                      <th className="text-right">Amount</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualSpends.map((s, i) => {
                      const allCh = [
                        ...DEFAULT_CHANNELS,
                        ...customChannels.map(c => ({ label: c.label, color: c.color }))
                      ]
                      const ch = allCh.find(c => c.label === s.channel)
                      return (
                        <tr key={i}>
                          <td className="font-medium text-slate-700">{s.month}</td>
                          <td>
                            <span className="flex items-center gap-1.5 text-sm">
                              <div className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: ch?.color || '#64748B' }} />
                              {s.channel}
                            </span>
                          </td>
                          <td className="text-slate-600">{s.description}</td>
                          <td className="text-right font-semibold text-blue-700">
                            Rs.{s.amount.toLocaleString()}
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setSpendForm(s); setShowSpendForm(true) }}
                                className="text-xs text-blue-600 hover:underline">Edit</button>
                              <button onClick={() => s.id && deleteSpend(s.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors">
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Analysis by month */}
          {Object.keys(spendByMonth).length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-700 mb-4">Manual Spend Analysis — by Month & Channel</h2>
              <div className="space-y-6">
                {Object.entries(spendByMonth).sort().reverse().map(([month, channels]) => {
                  const monthTotal = Object.values(channels).reduce((s, v) => s + v, 0)
                  const budgetForMonth = history.find(h => h.month === month)
                  return (
                    <div key={month}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">{month}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-slate-500">
                            Total: <strong className="text-blue-700">{fmtRs(monthTotal)}</strong>
                          </span>
                          {budgetForMonth && (
                            <span className={`px-2 py-0.5 rounded-full font-medium
                              ${monthTotal > budgetForMonth.budget
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'}`}>
                              {((monthTotal / budgetForMonth.budget) * 100).toFixed(1)}% of budget
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(channels).map(([channel, amount]) => {
                          const allCh = [
                            ...DEFAULT_CHANNELS,
                            ...customChannels.map(c => ({ label: c.label, color: c.color, key: '' }))
                          ]
                          const ch = allCh.find(c => c.label === channel)
                          const channelBudget = budgetForMonth
                            ? ((budgetForMonth as any)[ch?.key || ''] || 0)
                            : 0
                          const pct = channelBudget > 0
                            ? Math.min((amount / channelBudget) * 100, 100) : 0
                          return (
                            <div key={channel} className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: ch?.color || '#64748B' }} />
                              <span className="text-xs text-slate-500 w-40 shrink-0">{channel}</span>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-2 rounded-full transition-all"
                                  style={{
                                    width: channelBudget > 0 ? `${pct}%` : '0%',
                                    background: ch?.color || '#64748B'
                                  }} />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 w-20 text-right shrink-0">
                                {fmtRs(amount)}
                              </span>
                              {channelBudget > 0 && (
                                <span className="text-xs text-slate-400 w-24 text-right shrink-0">
                                  / {fmtRs(channelBudget)}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}