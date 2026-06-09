-- IDEALZ Marketing Analytics System — Full Database Schema
-- Run in Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS meta_campaigns (
  id BIGSERIAL PRIMARY KEY, month TEXT NOT NULL, campaign_name TEXT NOT NULL,
  spend NUMERIC DEFAULT 0, impressions BIGINT DEFAULT 0, reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0, cpc NUMERIC DEFAULT 0, cpm NUMERIC DEFAULT 0,
  ctr NUMERIC DEFAULT 0, leads INT DEFAULT 0, purchases INT DEFAULT 0,
  frequency NUMERIC DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS meta_audience (
  id BIGSERIAL PRIMARY KEY, month TEXT NOT NULL, age_group TEXT, gender TEXT,
  spend NUMERIC DEFAULT 0, clicks BIGINT DEFAULT 0, impressions BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tiktok_campaigns (
  id BIGSERIAL PRIMARY KEY, month TEXT NOT NULL, campaign_name TEXT NOT NULL,
  spend NUMERIC DEFAULT 0, impressions BIGINT DEFAULT 0, clicks BIGINT DEFAULT 0,
  cpc NUMERIC DEFAULT 0, cpm NUMERIC DEFAULT 0, ctr NUMERIC DEFAULT 0,
  video_views BIGINT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS influencer_log (
  id BIGSERIAL PRIMARY KEY, month TEXT NOT NULL, influencer_name TEXT NOT NULL,
  platform TEXT DEFAULT 'Instagram', cost NUMERIC DEFAULT 0,
  reach BIGINT DEFAULT 0, leads INT DEFAULT 0,
  shoot_type TEXT DEFAULT 'standard', notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY, alert_type TEXT NOT NULL, message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium', campaign_name TEXT, month TEXT,
  value NUMERIC, threshold NUMERIC, resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS upload_history (
  id BIGSERIAL PRIMARY KEY, filename TEXT NOT NULL, file_type TEXT NOT NULL,
  month TEXT NOT NULL, rows_loaded INT DEFAULT 0, status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meta_month ON meta_campaigns(month);
CREATE INDEX IF NOT EXISTS idx_tiktok_month ON tiktok_campaigns(month);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);

CREATE OR REPLACE VIEW mom_meta AS
SELECT month, SUM(spend) AS total_spend, SUM(clicks) AS total_clicks,
  SUM(leads) AS total_leads, SUM(impressions) AS total_impressions,
  ROUND(AVG(cpc)::NUMERIC,2) AS avg_cpc, ROUND(AVG(cpm)::NUMERIC,2) AS avg_cpm,
  LAG(SUM(spend)) OVER (ORDER BY month) AS prev_spend,
  LAG(SUM(leads)) OVER (ORDER BY month) AS prev_leads,
  ROUND(CASE WHEN LAG(SUM(spend)) OVER (ORDER BY month) > 0
    THEN ((SUM(spend)-LAG(SUM(spend)) OVER (ORDER BY month))
    /LAG(SUM(spend)) OVER (ORDER BY month)*100) END::NUMERIC,1) AS spend_pct_change,
  ROUND(CASE WHEN LAG(AVG(cpc)) OVER (ORDER BY month) > 0
    THEN ((AVG(cpc)-LAG(AVG(cpc)) OVER (ORDER BY month))
    /LAG(AVG(cpc)) OVER (ORDER BY month)*100) END::NUMERIC,1) AS cpc_pct_change
FROM meta_campaigns GROUP BY month ORDER BY month;

ALTER TABLE meta_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_audience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON meta_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON tiktok_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON influencer_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON upload_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON meta_audience FOR ALL TO authenticated USING (true) WITH CHECK (true);
