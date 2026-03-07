import Link from 'next/link'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import type { BlockerEvent } from '@/lib/observability/types'

interface LaunchBlockerSectionProps {
  openBlockers: BlockerEvent[]
  recentlyResolved: BlockerEvent[]
}

export function LaunchBlockerSection({ openBlockers, recentlyResolved }: LaunchBlockerSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <ShieldAlert size={14} className="text-red-400" />
        <h3 className="text-sm font-semibold text-foreground">Launch Blockers</h3>
        {openBlockers.length > 0 && (
          <span className="ml-auto rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-400">
            {openBlockers.length} open
          </span>
        )}
      </div>

      <div className="divide-y divide-border">
        {openBlockers.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-4 text-sm text-emerald-400">
            <CheckCircle2 size={14} />
            No open blockers — cleared for launch!
          </div>
        ) : (
          openBlockers.map((b) => (
            <BlockerRow key={b.id} event={b} />
          ))
        )}
      </div>

      {recentlyResolved.length > 0 && (
        <>
          <div className="border-t border-border px-4 py-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Recently resolved
            </span>
          </div>
          <div className="divide-y divide-border">
            {recentlyResolved.map((b) => (
              <BlockerRow key={b.id} event={b} resolved />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function BlockerRow({ event, resolved = false }: { event: BlockerEvent; resolved?: boolean }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className={`group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 ${resolved ? 'opacity-60' : ''}`}
    >
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
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{event.summary}</p>
        )}
      </div>
      <span className="flex-shrink-0 text-[11px] text-muted-foreground">
        {formatDistanceToNow(parseISO(event.event_timestamp), { addSuffix: true })}
      </span>
    </Link>
  )
}
