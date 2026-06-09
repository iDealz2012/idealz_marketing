'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { parseMetaCSV } from '@/lib/parsers/metaParser'
import { parseTikTokCSV } from '@/lib/parsers/tiktokParser'
import { runAlertChecks } from '@/lib/alerts'
import { Upload, CheckCircle, XCircle, Loader2, FileText, Info } from 'lucide-react'

interface UploadResult {
  file: string
  type: string
  month: string
  rows: number
  alerts: number
  status: 'success' | 'error'
  error?: string
}

function detectFileType(filename: string): { type: string; month: string } | null {
  const lower = filename.toLowerCase()
  // Extract month from filename — expects YYYY-MM pattern
  const monthMatch = filename.match(/(\d{4}-\d{2})/)
  const month = monthMatch ? monthMatch[1] : new Date().toISOString().slice(0, 7)

  if (lower.includes('meta_campaign') || lower.includes('lk_digibrush') || lower.includes('lk_idealz'))
    return { type: 'meta_campaigns', month }
  if (lower.includes('meta_age') || lower.includes('age_gender'))
    return { type: 'meta_audience', month }
  if (lower.includes('tiktok_campaign') || lower.includes('tiktok'))
    return { type: 'tiktok_campaigns', month }
  if (lower.includes('influencer'))
    return { type: 'influencer_log', month }
  return null
}

export default function UploadPage() {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [results,   setResults]   = useState<UploadResult[]>([])
  const [history,   setHistory]   = useState<any[]>([])
  const supabase = createClient()

  const processFile = async (file: File): Promise<UploadResult> => {
    const detected = detectFileType(file.name)
    if (!detected) {
      return { file: file.name, type: 'unknown', month: '', rows: 0, alerts: 0,
               status: 'error', error: 'Filename not recognised. Check the naming guide below.' }
    }
    const { type, month } = detected
    try {
      const text = await file.text()
      let rowsLoaded = 0
      let alertCount = 0

      if (type === 'meta_campaigns') {
        const rows = parseMetaCSV(text, month)
        if (rows.length === 0) throw new Error('No data rows found — check the CSV format')
        // Delete existing data for this month before inserting
        await supabase.from('meta_campaigns').delete().eq('month', month)
        const { error } = await supabase.from('meta_campaigns').insert(rows)
        if (error) throw error
        rowsLoaded = rows.length
        alertCount = await runAlertChecks(rows, [], month)
      }

      if (type === 'tiktok_campaigns') {
        const rows = parseTikTokCSV(text, month)
        if (rows.length === 0) throw new Error('No data rows found — check the CSV format')
        await supabase.from('tiktok_campaigns').delete().eq('month', month)
        const { error } = await supabase.from('tiktok_campaigns').insert(rows)
        if (error) throw error
        rowsLoaded = rows.length
        alertCount = await runAlertChecks([], rows, month)
      }

      // Log upload
      await supabase.from('upload_history').insert({
        filename: file.name, file_type: type, month, rows_loaded: rowsLoaded, status: 'success'
      })

      return { file: file.name, type, month, rows: rowsLoaded, alerts: alertCount, status: 'success' }
    } catch (err: any) {
      await supabase.from('upload_history').insert({
        filename: file.name, file_type: type, month, rows_loaded: 0, status: 'error'
      })
      return { file: file.name, type, month, rows: 0, alerts: 0, status: 'error', error: err.message }
    }
  }

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    setResults([])
    const results: UploadResult[] = []
    for (const file of Array.from(files)) {
      const r = await processFile(file)
      results.push(r)
    }
    setResults(results)

    // Refresh upload history
    const { data } = await supabase.from('upload_history')
      .select('*').order('created_at', { ascending: false }).limit(20)
    setHistory(data || [])
    setUploading(false)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }, [])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files)
  }

  const TYPE_LABELS: Record<string, string> = {
    meta_campaigns:  'Meta Campaigns',
    meta_audience:   'Meta Audience',
    tiktok_campaigns:'TikTok Campaigns',
    influencer_log:  'Influencer Log',
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Upload Marketing Data</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload on the 1st of every month — takes about 15 minutes
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={`upload-zone ${dragging ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}>

        <input id="file-input" type="file" multiple accept=".csv,.xlsx,.xls"
               className="hidden" onChange={onInputChange} />

        {uploading ? (
          <>
            <Loader2 size={36} className="text-blue-500 animate-spin" />
            <p className="text-slate-600 font-medium">Processing files...</p>
          </>
        ) : (
          <>
            <Upload size={36} className="text-slate-400" />
            <div className="text-center">
              <p className="text-slate-700 font-medium">Drop CSV files here or click to browse</p>
              <p className="text-slate-400 text-sm mt-1">Meta CSV, TikTok CSV — multiple files at once</p>
            </div>
            <div className="flex gap-2 text-xs text-slate-400">
              <span className="bg-slate-100 px-2 py-1 rounded">.csv</span>
              <span className="bg-slate-100 px-2 py-1 rounded">.xlsx</span>
              <span className="bg-slate-100 px-2 py-1 rounded">.xls</span>
            </div>
          </>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">Upload Results</h2>
          {results.map((r, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border
              ${r.status === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'}`}>
              {r.status === 'success'
                ? <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
                : <XCircle    size={18} className="text-red-500 mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-700 truncate">{r.file}</div>
                {r.status === 'success' ? (
                  <div className="text-xs text-slate-500 mt-0.5 flex gap-3">
                    <span>Type: <strong>{TYPE_LABELS[r.type] || r.type}</strong></span>
                    <span>Month: <strong>{r.month}</strong></span>
                    <span>Rows loaded: <strong>{r.rows}</strong></span>
                    {r.alerts > 0 && (
                      <span className="text-amber-600 font-semibold">
                        ⚠ {r.alerts} alert{r.alerts !== 1 ? 's' : ''} generated
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-red-600 mt-0.5">{r.error}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Naming guide */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-700">File Naming Guide</h2>
        </div>
        <div className="space-y-2">
          {[
            ['meta_campaigns_YYYY-MM.csv', 'Meta campaign spend, CPC, CPM, leads', 'meta_campaigns_2026-05.csv'],
            ['tiktok_campaigns_YYYY-MM.csv', 'TikTok campaign data', 'tiktok_campaigns_2026-05.csv'],
            ['influencer_log_YYYY-MM.csv', 'Influencer shoot log', 'influencer_log_2026-05.csv'],
          ].map(([format, desc, example]) => (
            <div key={format} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs font-medium text-blue-700">{format}</div>
                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                <div className="text-xs text-slate-400 mt-0.5">Example: {example}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          The system detects the file type and month automatically from the filename.
          Names must follow the format above exactly.
        </p>
      </div>
    </div>
  )
}
