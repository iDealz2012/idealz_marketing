interface KPICardProps {
  label: string
  value: string
  sub?: string
  change?: number | null
  color?: 'blue' | 'green' | 'red' | 'amber' | 'navy'
  icon?: React.ReactNode
}

const COLOR_MAP = {
  blue:  'border-l-[#1F5FA6] bg-blue-50/50',
  green: 'border-l-[#1D7A4F] bg-green-50/50',
  red:   'border-l-[#C0392B] bg-red-50/50',
  amber: 'border-l-[#E07B2A] bg-amber-50/50',
  navy:  'border-l-[#0A2342] bg-slate-50/50',
}

const VAL_COLOR = {
  blue:  'text-[#1F5FA6]',
  green: 'text-[#1D7A4F]',
  red:   'text-[#C0392B]',
  amber: 'text-[#E07B2A]',
  navy:  'text-[#0A2342]',
}

export default function KPICard({
  label, value, sub, change, color = 'blue', icon
}: KPICardProps) {
  const up   = change !== null && change !== undefined && change > 0
  const down = change !== null && change !== undefined && change < 0

  // For CPC/CPM — down is good. For spend/leads — up is good.
  const isMetricWhereDownIsGood = label.toLowerCase().includes('cpc') ||
                                   label.toLowerCase().includes('cpm') ||
                                   label.toLowerCase().includes('cost per')

  const positiveChange = isMetricWhereDownIsGood ? down : up
  const negativeChange = isMetricWhereDownIsGood ? up  : down

  return (
    <div className={`kpi-card border-l-4 ${COLOR_MAP[color]}`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>

      <div className={`text-2xl font-bold mt-1 ${VAL_COLOR[color]}`}>
        {value}
      </div>

      <div className="flex items-center gap-2 mt-1">
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
        {change !== null && change !== undefined && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded
            ${positiveChange ? 'bg-green-100 text-green-700' :
              negativeChange ? 'bg-red-100 text-red-600' :
              'bg-slate-100 text-slate-500'}`}>
            {change > 0 ? '↑' : change < 0 ? '↓' : '—'} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}
