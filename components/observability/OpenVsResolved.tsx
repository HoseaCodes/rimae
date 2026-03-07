import { CheckCircle2, Clock, Archive, XCircle } from 'lucide-react'
import type { HealthMetrics } from '@/lib/observability/types'

interface OpenVsResolvedProps {
  health: HealthMetrics
}

export function OpenVsResolved({ health }: OpenVsResolvedProps) {
  const total = health.total || 1 // avoid div/0

  const bars = [
    { key: 'open', label: 'Open', value: health.open, color: 'bg-yellow-400', icon: <Clock size={12} className="text-yellow-400" /> },
    { key: 'in_progress', label: 'In Progress', value: health.inProgress, color: 'bg-blue-400', icon: <Clock size={12} className="text-blue-400" /> },
    { key: 'resolved', label: 'Resolved', value: health.resolved, color: 'bg-emerald-400', icon: <CheckCircle2 size={12} className="text-emerald-400" /> },
    { key: 'wont_fix', label: "Won't Fix", value: health.wontFix, color: 'bg-zinc-500', icon: <XCircle size={12} className="text-zinc-500" /> },
    { key: 'archived', label: 'Archived', value: health.archived, color: 'bg-zinc-600', icon: <Archive size={12} className="text-zinc-600" /> },
  ]

  const score = health.healthScore

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Open vs Resolved</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">All-time event health</p>
        </div>
        <div className="text-right">
          <div
            className={`text-lg font-bold ${
              score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`}
          >
            {score}%
          </div>
          <div className="text-[10px] text-muted-foreground">health score</div>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="mb-4 flex h-2 w-full overflow-hidden rounded-full">
        {bars.map((b) => (
          <div
            key={b.key}
            className={b.color}
            style={{ width: `${(b.value / total) * 100}%` }}
            title={`${b.label}: ${b.value}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {bars.map((b) => (
          <div key={b.key} className="flex items-center gap-1.5">
            {b.icon}
            <span className="text-xs text-muted-foreground">{b.label}</span>
            <span className="ml-auto text-xs font-semibold text-foreground">{b.value}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="ml-auto text-xs font-semibold text-foreground">{health.total}</span>
        </div>
      </div>
    </div>
  )
}
