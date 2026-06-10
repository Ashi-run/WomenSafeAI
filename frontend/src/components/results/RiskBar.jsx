import { cn, getRiskLevel } from '../../utils/helpers'

export default function RiskBar({ score, label, showLabel = true, height = 'h-3' }) {
  const { barColor, label: riskLabel } = getRiskLevel(score)
  const pct = score != null ? Math.min(100, Math.max(0, score)) : 0

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#6B7280] font-medium">{label}</span>
          <span className="font-semibold" style={{ color: barColor }}>
            {score != null ? Math.round(score) : '--'}/100 · {riskLabel}
          </span>
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', height)}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1) 300ms',
          }}
        />
      </div>
    </div>
  )
}
