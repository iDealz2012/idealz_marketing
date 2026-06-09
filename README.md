# Idealz Marketing Analytics System

A web-based marketing analytics dashboard for Idealz — tracking Meta Ads, TikTok Ads, and Influencer performance with month-on-month comparisons, smart alerts, and automatic reporting.

---

## Tech Stack

| Layer | Tool | Cost |
|-------|------|------|
| Frontend hosting | Netlify | Free |
| Framework | Next.js 14 | Free |
| Database + API | Supabase | Free |
| Charts | Recharts | Free |
| CSV parsing | PapaParse | Free |
| Excel parsing | SheetJS | Free |
| **Total** | | **Rs. 0 / month** |

---

## Setup in 5 Steps

### Step 1 — Create accounts (30 min)

1. [GitHub](https://github.com) — create free account
2. [Supabase](https://supabase.com) — create free account
3. [Netlify](https://netlify.com) — create free account
4. [Node.js](https://nodejs.org) — install on your computer (v20+)

### Step 2 — Create Supabase project (10 min)

1. Go to supabase.com → New Project
2. Name: `idealz-analytics`
3. Region: **Singapore** (closest to Sri Lanka)
4. Copy your **Project URL** and **anon key** from Project Settings → API

### Step 3 — Set up the database (15 min)

1. In Supabase → SQL Editor → New Query
2. Copy the entire contents of `supabase/migrations/001_schema.sql`
3. Paste and click **Run**
4. You should see all tables created successfully

### Step 4 — Run locally (10 min)

```bash
# Clone the project
git clone https://github.com/YOUR_USERNAME/idealz-analytics
cd idealz-analytics

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local and add your Supabase URL and anon key

# Start development server
npm run dev
# Open http://localhost:3000
```

### Step 5 — Deploy to Netlify (10 min)

```bash
# Push to GitHub
git add .
git commit -m "initial deploy"
git push origin main
```

1. Go to Netlify → Add new site → Import from GitHub
2. Select your `idealz-analytics` repository
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Deploy** — live in 2 minutes
7. Optional: Add custom domain `analytics.idealz.lk` in Netlify → Domain settings

---

## Add Team Members

1. Go to Supabase → Authentication → Users → Invite user
2. Enter team member email → they receive a login link
3. Share the Netlify URL with the team

---

## Monthly Data Upload (15 min on 1st of each month)

### Export from Meta Ads Manager
1. Go to Ads Manager → Campaigns tab
2. Date range: previous full month
3. Columns: Customize → add Spend, CPC, CPM, CTR, Leads, Purchases, Frequency
4. Export → CSV
5. **Save as:** `meta_campaigns_2026-05.csv` (use correct year-month)

### Export from TikTok Ads Manager
1. Go to ads.tiktok.com → Reporting → Custom Report
2. Date range: previous full month, Dimension: Campaign
3. Metrics: Cost, Impressions, Clicks, CPC, CPM, Video Views
4. Download → CSV
5. **Save as:** `tiktok_campaigns_2026-05.csv`

### Upload files
1. Go to your Netlify URL → Upload Data page
2. Drag both CSV files onto the upload zone
3. Done — dashboard updates instantly

---

## File Naming Convention

Files must be named exactly as follows (system auto-detects type from name):

| File | Purpose |
|------|---------|
| `meta_campaigns_YYYY-MM.csv` | Meta campaign data |
| `tiktok_campaigns_YYYY-MM.csv` | TikTok campaign data |
| `influencer_log_YYYY-MM.csv` | Influencer shoots (or add manually in app) |

---

## Smart Alerts — What Gets Flagged

| Alert | Trigger |
|-------|---------|
| CPC Spike | Any campaign CPC > Rs. 15 |
| High CPM | Meta CPM > Rs. 220 |
| Zero Leads | Spend > Rs. 30,000 with 0 leads |
| Budget Warning | Total monthly spend > Rs. 2.7M |
| High Frequency | Ad frequency > 4.0 |
| Low CTR | CTR < 0.5% with > 10,000 impressions |
| TikTok CPM | TikTok CPM > USD 0.80 |

---

## Dashboard Pages

| Page | URL | Purpose |
|------|-----|---------|
| Overview | /dashboard | KPIs, spend chart, top campaigns, alerts |
| Monthly Analysis | /monthly | Month-on-month comparison table and charts |
| Channel Comparison | /channels | Meta vs TikTok vs Influencer |
| Campaign Detail | /campaigns | All campaigns sortable by any metric |
| Influencer Tracker | /influencers | ROI ranking by cost per lead |
| Upload Data | /upload | CSV/Excel file upload |

---

## Project Structure

```
idealz-analytics/
├── app/
│   ├── layout.tsx          — Sidebar + header layout
│   ├── page.tsx            — Redirects to /dashboard
│   ├── globals.css         — Tailwind + custom styles
│   ├── dashboard/page.tsx  — Main KPI dashboard
│   ├── monthly/page.tsx    — MoM analysis
│   ├── channels/page.tsx   — Channel comparison
│   ├── campaigns/page.tsx  — Campaign detail table
│   ├── influencers/page.tsx— Influencer ROI tracker
│   ├── upload/page.tsx     — File upload
│   └── login/page.tsx      — Auth login
├── components/
│   ├── charts/
│   │   ├── SpendChart.tsx  — Line chart
│   │   └── ChannelDonut.tsx— Donut chart
│   └── ui/
│       └── KPICard.tsx     — KPI metric card
├── lib/
│   ├── supabase/client.ts  — Browser Supabase client
│   ├── types.ts            — TypeScript interfaces
│   ├── alerts.ts           — Smart alert detection
│   └── parsers/
│       ├── metaParser.ts   — Meta CSV parser
│       └── tiktokParser.ts — TikTok CSV parser
├── supabase/
│   └── migrations/
│       └── 001_schema.sql  — Full database schema
├── .env.local.example      — Environment variables template
├── netlify.toml            — Netlify deployment config
└── README.md               — This file
```

---

## Troubleshooting

**Upload says "filename not recognised"**
→ Rename your file to exactly `meta_campaigns_2026-05.csv` format

**Dashboard shows no data**
→ Check if upload was successful in Upload page history

**Build fails on Netlify**
→ Check environment variables are set correctly in Netlify → Site settings → Environment variables

**Login not working**
→ Go to Supabase → Authentication → Users — confirm the user account exists

---

*Idealz Lanka Marketing Analytics System v1.0 — May 2026*
