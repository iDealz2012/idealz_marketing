import Papa from 'papaparse'
import type { MetaCampaign } from '../types'

// Maps common Meta column name variations to our standard keys
const COL_MAP: Record<string, string> = {
  'campaign name':                      'campaign_name',
  'campaign':                           'campaign_name',
  'amount spent (lkr)':                 'spend',
  'amount spent':                       'spend',
  'spend':                              'spend',
  'impressions':                        'impressions',
  'reach':                              'reach',
  'link clicks':                        'clicks',
  'clicks (all)':                       'clicks',
  'cpc (cost per link click) (lkr)':   'cpc',
  'cpc (cost per link click)':          'cpc',
  'cpc (all)':                          'cpc',
  'cpm (cost per 1,000 impressions) (lkr)': 'cpm',
  'cpm (cost per 1,000 impressions)':   'cpm',
  'ctr (link click-through rate)':      'ctr',
  'ctr (all)':                          'ctr',
  'leads':                              'leads',
  'results':                            'leads',
  'purchases':                          'purchases',
  'frequency':                          'frequency',
}

function normaliseKey(key: string): string {
  return key.toLowerCase().trim()
}

function parseNum(val: any): number {
  if (!val || val === '--' || val === '') return 0
  const n = parseFloat(String(val).replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

export function parseMetaCSV(csvText: string, month: string): MetaCampaign[] {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  const rows: MetaCampaign[] = []

  result.data.forEach((rawRow: any) => {
    const row: any = {}
    Object.keys(rawRow).forEach(key => {
      const normKey = normaliseKey(key)
      const mappedKey = COL_MAP[normKey]
      if (mappedKey) row[mappedKey] = rawRow[key]
    })

    // Skip rows without a campaign name or spend
    if (!row.campaign_name || row.campaign_name === 'Total') return

    rows.push({
      month,
      campaign_name: String(row.campaign_name || '').trim(),
      spend:       parseNum(row.spend),
      impressions: parseNum(row.impressions),
      reach:       parseNum(row.reach),
      clicks:      parseNum(row.clicks),
      cpc:         parseNum(row.cpc),
      cpm:         parseNum(row.cpm),
      ctr:         parseNum(row.ctr),
      leads:       parseNum(row.leads),
      purchases:   parseNum(row.purchases),
      frequency:   parseNum(row.frequency),
    })
  })

  return rows
}
