import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  sublabel?: string
  accent?: 'default' | 'red' | 'orange' | 'green' | 'blue'
  'data-testid'?: string
}

function StatCard({ label, value, sublabel, accent = 'default', 'data-testid': testId }: StatCardProps) {
  const accentStyles: Record<string, string> = {
    default: 'border-border',
    red: 'border-red-500/40',
    orange: 'border-orange-500/40',
    green: 'border-emerald-500/40',
    blue: 'border-sky-500/40',
  }
  const valueStyles: Record<string, string> = {
    default: 'text-foreground',
    red: 'text-red-400',
    orange: 'text-orange-400',
    green: 'text-emerald-400',
    blue: 'text-sky-400',
  }

  return (
    <div
      data-testid={testId}
      className={cn(
        'flex flex-col gap-1 rounded-lg border bg-card p-4',
        accentStyles[accent]
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', valueStyles[accent])}>
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-muted-foreground/70">{sublabel}</p>
      )}
    </div>
  )
}

interface StatsGridProps {
  totalEvents: number
  openEvents: number
  criticalHighOpen: number
  resolvedEvents: number
}

export function StatsGrid({
  totalEvents,
  openEvents,
  criticalHighOpen,
  resolvedEvents,
}: StatsGridProps) {
  return (
    <div data-testid="stats-grid" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard data-testid="stat-total" label="Total Events" value={totalEvents} />
      <StatCard
        data-testid="stat-open"
        label="Open"
        value={openEvents}
        sublabel="requiring attention"
        accent="blue"
      />
      <StatCard
        data-testid="stat-critical-high"
        label="Critical / High Open"
        value={criticalHighOpen}
        sublabel="high priority"
        accent={criticalHighOpen > 0 ? 'red' : 'default'}
      />
      <StatCard
        data-testid="stat-resolved"
        label="Resolved"
        value={resolvedEvents}
        sublabel="closed out"
        accent="green"
      />
    </div>
  )
}
