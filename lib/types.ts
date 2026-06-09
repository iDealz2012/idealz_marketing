export interface MetaCampaign {
  id?: number
  month: string
  campaign_name: string
  spend: number
  impressions: number
  reach: number
  clicks: number
  cpc: number
  cpm: number
  ctr: number
  leads: number
  purchases: number
  frequency?: number
}

export interface TikTokCampaign {
  id?: number
  month: string
  campaign_name: string
  spend: number
  impressions: number
  clicks: number
  cpc: number
  cpm: number
  ctr: number
  video_views: number
}

export interface InfluencerLog {
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

export interface Alert {
  id?: number
  alert_type: string
  message: string
  severity: 'critical' | 'high' | 'medium'
  campaign_name?: string
  month?: string
  value?: number
  threshold?: number
  resolved: boolean
  created_at?: string
}

export interface MoMRow {
  month: string
  total_spend: number
  total_clicks: number
  total_leads: number
  total_impressions: number
  avg_cpc: number
  avg_cpm: number
  prev_spend: number | null
  prev_leads: number | null
  spend_pct_change: number | null
  cpc_pct_change: number | null
}

export interface KPIData {
  total_spend: number
  total_leads: number
  avg_cpc: number
  avg_cpm: number
  total_clicks: number
  total_impressions: number
}