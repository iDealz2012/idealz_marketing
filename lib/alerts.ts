import { createClient } from './supabase/client'
import type { MetaCampaign, TikTokCampaign, Alert } from './types'

const THRESHOLDS = {
  META_CPC_MAX:     15,
  META_CPM_MAX:     220,
  META_CTR_MIN:     0.5,
  META_FREQ_MAX:    4.0,
  ZERO_LEADS_SPEND: 30000,
  TIKTOK_CPM_MAX:   0.80,
}

export async function runAlertChecks(
  metaRows: MetaCampaign[],
  tiktokRows: TikTokCampaign[],
  month: string
) {
  const supabase = createClient()
  const newAlerts: Omit<Alert, 'id' | 'created_at'>[] = []

  metaRows.forEach(row => {
    // CPC spike
    if ((row.cpc ?? 0) > THRESHOLDS.META_CPC_MAX) {
      newAlerts.push({
        alert_type: 'cpc_spike',
        message: `CPC Rs.${row.cpc?.toFixed(2)} on "${row.campaign_name}" exceeds Rs.${THRESHOLDS.META_CPC_MAX} target`,
        severity: (row.cpc ?? 0) > 25 ? 'critical' : 'high',
        campaign_name: row.campaign_name,
        month,
        value: row.cpc ?? 0,
        threshold: THRESHOLDS.META_CPC_MAX,
        resolved: false,
      })
    }

    // CPM high
    if ((row.cpm ?? 0) > THRESHOLDS.META_CPM_MAX) {
      newAlerts.push({
        alert_type: 'cpm_high',
        message: `CPM Rs.${row.cpm?.toFixed(0)} on "${row.campaign_name}" exceeds Rs.${THRESHOLDS.META_CPM_MAX}`,
        severity: 'high',
        campaign_name: row.campaign_name,
        month,
        value: row.cpm ?? 0,
        threshold: THRESHOLDS.META_CPM_MAX,
        resolved: false,
      })
    }

    // Zero leads with spend
    if ((row.leads ?? 0) === 0 && (row.spend ?? 0) > THRESHOLDS.ZERO_LEADS_SPEND) {
      newAlerts.push({
        alert_type: 'zero_leads',
        message: `Rs.${row.spend?.toLocaleString()} spent on "${row.campaign_name}" with 0 leads — check campaign objective`,
        severity: 'critical',
        campaign_name: row.campaign_name,
        month,
        value: row.spend ?? 0,
        threshold: THRESHOLDS.ZERO_LEADS_SPEND,
        resolved: false,
      })
    }

    // High frequency
    if ((row.frequency ?? 0) > THRESHOLDS.META_FREQ_MAX) {
      newAlerts.push({
        alert_type: 'high_frequency',
        message: `Ad frequency ${(row.frequency ?? 0).toFixed(1)} on "${row.campaign_name}" — audience fatigue risk`,
        severity: 'medium',
        campaign_name: row.campaign_name,
        month,
        value: row.frequency ?? 0,
        threshold: THRESHOLDS.META_FREQ_MAX,
        resolved: false,
      })
    }

    // Low CTR
    if ((row.ctr ?? 0) < THRESHOLDS.META_CTR_MIN && (row.impressions ?? 0) > 10000) {
      newAlerts.push({
        alert_type: 'low_ctr',
        message: `CTR ${(row.ctr ?? 0).toFixed(2)}% on "${row.campaign_name}" is below ${THRESHOLDS.META_CTR_MIN}% — refresh creative`,
        severity: 'medium',
        campaign_name: row.campaign_name,
        month,
        value: row.ctr ?? 0,
        threshold: THRESHOLDS.META_CTR_MIN,
        resolved: false,
      })
    }
  })

  // TikTok CPM
  tiktokRows.forEach(row => {
    if ((row.cpm ?? 0) > THRESHOLDS.TIKTOK_CPM_MAX) {
      newAlerts.push({
        alert_type: 'tiktok_cpm_high',
        message: `TikTok CPM $${(row.cpm ?? 0).toFixed(2)} on "${row.campaign_name}" exceeds $${THRESHOLDS.TIKTOK_CPM_MAX} target`,
        severity: 'medium',
        campaign_name: row.campaign_name,
        month,
        value: row.cpm ?? 0,
        threshold: THRESHOLDS.TIKTOK_CPM_MAX,
        resolved: false,
      })
    }
  })

  // Monthly budget warning
  const totalSpend = metaRows.reduce((sum, r) => sum + (r.spend ?? 0), 0)
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

  if (newAlerts.length > 0) {
    await supabase.from('alerts').insert(newAlerts)
  }

  return newAlerts.length
}
