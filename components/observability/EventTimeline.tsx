import Link from 'next/link'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import type { TimelineDay } from '@/lib/observability/types'

interface EventTimelineProps {
  days: TimelineDay[]
}

export function EventTimeline({ days }: EventTimelineProps) {
  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
        No events in the last 30 days.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <div key={day.dateKey}>
          {/* Day heading */}
          <div className="mb-2 flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">{day.label}</span>
            <div className="h-px flex-1 bg-border" />
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {day.events.length}
            </span>
          </div>

          {/* Events */}
          <div className="space-y-1.5 pl-1">
            {day.events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group flex items-start gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-card"
              >
                {/* Severity indicator dot */}
                <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${severityDot(event.severity)}`} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CategoryBadge category={event.category} />
                    <SeverityBadge severity={event.severity} />
                    <StatusBadge status={event.status} />
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-foreground group-hover:text-foreground/90">
                    {event.title}
                  </p>
                  {event.summary && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {event.summary}
                    </p>
                  )}
                </div>

                <span className="flex-shrink-0 text-[11px] text-muted-foreground">
                  {formatDistanceToNow(parseISO(event.event_timestamp), { addSuffix: true })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function severityDot(severity: string): string {
  const map: Record<string, string> = {
    critical: 'bg-red-400',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-blue-400',
    info: 'bg-zinc-500',
  }
  return map[severity] ?? 'bg-zinc-500'
}
