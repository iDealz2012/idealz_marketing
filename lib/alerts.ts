import { createClient } from './supabase/client'
import type { MetaCampaign, TikTokCampaign, Alert } from './types'

const THRESHOLDS = {
  META_CPC_MAX:      15,      // Rs.
  META_CPM_MAX:      220,     // Rs.
  META_CTR_MIN:      0.5,     // %
  META_FREQ_MAX:     4.0,
  ZERO_LEADS_SPEND:  30000,   // Rs. — flag if spent this much with 0 leads
  TIKTOK_CPM_MAX:    0.80,    // USD
}

export async function runAlertChecks(
  metaRows: MetaCampaign[],
  tiktokRows: TikTokCampaign[],
  month: string
) {
  const supabase = createClient()
  const newAlerts: Omit<Alert, 'id' | 'created_at'>[] = []

  // ── Meta CPC checks ────────────────────────────────────────
  metaRows.forEach(row => {
    if (row.cpc > THRESHOLDS.META_CPC_MAX) {
      newAlerts.push({
        alert_type: 'cpc_spike',
        message: `CPC Rs.${row.cpc.toFixed(2)} on "${row.campaign_name}" exceeds Rs.${THRESHOLDS.META_CPC_MAX} target`,
        severity: row.cpc > 25 ? 'critical' : 'high',
        campaign_name: row.campaign_name,
        month,
        value: row.cpc,
        threshold: THRESHOLDS.META_CPC_MAX,
        resolved: false,
      })
    }

    if (row.cpm > THRESHOLDS.META_CPM_MAX) {
      newAlerts.push({
        alert_type: 'cpm_high',
        message: `CPM Rs.${row.cpm.toFixed(0)} on "${row.campaign_name}" exceeds Rs.${THRESHOLDS.META_CPM_MAX}`,
        severity: 'high',
        campaign_name: row.campaign_name,
        month,
        value: row.cpm,
        threshold: THRESHOLDS.META_CPM_MAX,
        resolved: false,
      })
    }

    if (row.leads === 0 && row.spend > THRESHOLDS.ZERO_LEADS_SPEND) {
      newAlerts.push({
        alert_type: 'zero_leads',
        message: `Rs.${row.spend.toLocaleString()} spent on "${row.campaign_name}" with 0 leads — check campaign objective`,
        severity: 'critical',
        campaign_name: row.campaign_name,
        month,
        value: row.spend,
        threshold: THRESHOLDS.ZERO_LEADS_SPEND,
        resolved: false,
      })
    }

    if (row.frequency > THRESHOLDS.META_FREQ_MAX) {
      newAlerts.push({
        alert_type: 'high_frequency',
        message: `Ad frequency ${row.frequency.toFixed(1)} on "${row.campaign_name}" — audience fatigue risk`,
        severity: 'medium',
        campaign_name: row.campaign_name,
        month,
        value: row.frequency,
        threshold: THRESHOLDS.META_FREQ_MAX,
        resolved: false,
      })
    }

    if (row.ctr < THRESHOLDS.META_CTR_MIN && row.impressions > 10000) {
      newAlerts.push({
        alert_type: 'low_ctr',
        message: `CTR ${row.ctr.toFixed(2)}% on "${row.campaign_name}" is below ${THRESHOLDS.META_CTR_MIN}% — refresh creative`,
        severity: 'medium',
        campaign_name: row.campaign_name,
        month,
        value: row.ctr,
        threshold: THRESHOLDS.META_CTR_MIN,
        resolved: false,
      })
    }
  })

  // ── TikTok CPM checks ──────────────────────────────────────
  tiktokRows.forEach(row => {
    if (row.cpm > THRESHOLDS.TIKTOK_CPM_MAX) {
      newAlerts.push({
        alert_type: 'tiktok_cpm_high',
        message: `TikTok CPM $${row.cpm.toFixed(2)} on "${row.campaign_name}" exceeds $${THRESHOLDS.TIKTOK_CPM_MAX} target`,
        severity: 'medium',
        campaign_name: row.campaign_name,
        month,
        value: row.cpm,
        threshold: THRESHOLDS.TIKTOK_CPM_MAX,
        resolved: false,
      })
    }
  })

  // ── Monthly budget check ───────────────────────────────────
  const totalSpend = metaRows.reduce((sum, r) => sum + r.spend, 0)
  if (totalSpend > 2700000) {
    newAlerts.push({
      alert_type: 'budget_warning',
      message: `Total Meta spend Rs.${totalSpend.toLocaleString()} has exceeded 90% of Rs.3M budget`,
      severity: totalSpend > 2850000 ? 'critical' : 'high',
      month,
      value: totalSpend,
      threshold: 3000000,
      resolved: false,
    })
  }

  // ── Insert all new alerts ──────────────────────────────────
  if (newAlerts.length > 0) {
    await supabase.from('alerts').insert(newAlerts)
  }

  return newAlerts.length
}
