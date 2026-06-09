import Papa from 'papaparse'
import type { TikTokCampaign } from '../types'

const COL_MAP: Record<string, string> = {
  'campaign name':   'campaign_name',
  'campaign':        'campaign_name',
  'cost':            'spend',
  'spend':           'spend',
  'impressions':     'impressions',
  'clicks':          'clicks',
  'cpc':             'cpc',
  'cpm':             'cpm',
  'ctr':             'ctr',
  'click-through rate': 'ctr',
  'video views':     'video_views',
  '2-second video views': 'video_views',
  'video play actions': 'video_views',
}

function parseNum(val: any): number {
  if (!val || val === '--' || val === '') return 0
  const n = parseFloat(String(val).replace(/,/g, '').replace('%', ''))
  return isNaN(n) ? 0 : n
}

export function parseTikTokCSV(csvText: string, month: string): TikTokCampaign[] {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  const rows: TikTokCampaign[] = []

  result.data.forEach((rawRow: any) => {
    const row: any = {}
    Object.keys(rawRow).forEach(key => {
      const normKey = key.toLowerCase().trim()
      const mappedKey = COL_MAP[normKey]
      if (mappedKey) row[mappedKey] = rawRow[key]
    })

    if (!row.campaign_name || row.campaign_name === 'Total') return

    rows.push({
      month,
      campaign_name: String(row.campaign_name || '').trim(),
      spend:       parseNum(row.spend),
      impressions: parseNum(row.impressions),
      clicks:      parseNum(row.clicks),
      cpc:         parseNum(row.cpc),
      cpm:         parseNum(row.cpm),
      ctr:         parseNum(row.ctr),
      video_views: parseNum(row.video_views),
    })
  })

  return rows
}
