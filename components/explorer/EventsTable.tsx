import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { EVENT_TYPE_LABELS } from '@/lib/constants'
import type { EventCategory, EventSeverity, EventStatus, EventType, SourceType } from '@/lib/database.types'
import { getSimilarityLabel, getSimilarityColor } from '@/lib/semantic/build-embedding-input'

export type ExplorerEvent = {
  id: string
  title: string
  summary: string | null
  category: EventCategory
  severity: EventSeverity
  status: EventStatus
  event_type: EventType
  event_timestamp: string
  source_name: string | null
  source_type: SourceType | null
  tag_names: string[]
  project_id?: string
  similarity?: number
}

interface EventsTableProps {
  events: ExplorerEvent[]
  totalCount: number
  /** When provided, shows a project column. Keys are project IDs, values are project names. */
  projectsMap?: Record<string, string>
}

export function EventsTable({ events, totalCount, projectsMap }: EventsTableProps) {
  const showProject = !!projectsMap && Object.keys(projectsMap).length > 1
  if (events.length === 0) {
    return (
      <div data-testid="events-table-empty" className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
        <p className="text-sm font-medium text-foreground">No events match your filters</p>
        <p className="text-xs text-muted-foreground">
          Try adjusting your search or clearing filters
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p data-testid="events-count" className="text-xs text-muted-foreground">
        Showing {events.length} of {totalCount} event{totalCount !== 1 ? 's' : ''}
      </p>

      <div data-testid="events-table" className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Event
              </th>
              {showProject && (
                <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                  Project
                </th>
              )}
              <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Severity
              </th>
              <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground md:table-cell">
                Status
              </th>
              <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground lg:table-cell">
                Category
              </th>
              <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground xl:table-cell">
                Tags
              </th>
              <th className="hidden px-3 py-2 text-right text-xs font-medium text-muted-foreground lg:table-cell">
                When
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((event) => (
              <tr
                key={event.id}
                data-testid="event-row"
                data-event-id={event.id}
                className="group transition-colors hover:bg-muted/20"
              >
                <td className="px-3 py-2.5">
                  <Link
                    href={`/events/${event.id}`}
                    className="block font-medium text-foreground transition-colors group-hover:text-primary"
                  >
                    {event.title}
                  </Link>
                  {event.summary && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {event.summary}
                    </p>
                  )}
                  {event.similarity != null && (() => {
                    const label = getSimilarityLabel(event.similarity)
                    return (
                      <span className={`mt-0.5 block text-[10px] font-medium ${getSimilarityColor(label)}`}>
                        {label}
                      </span>
                    )
                  })()}
                  {event.source_name && (
                    <p className="mt-0.5 text-xs text-muted-foreground/60">
                      {event.source_name}
                    </p>
                  )}
                </td>
                {showProject && (
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {(event.project_id && projectsMap?.[event.project_id]) ?? '—'}
                    </span>
                  </td>
                )}
                <td className="hidden px-3 py-2.5 sm:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {EVENT_TYPE_LABELS[event.event_type]}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <SeverityBadge severity={event.severity} />
                </td>
                <td className="hidden px-3 py-2.5 md:table-cell">
                  <StatusBadge status={event.status} />
                </td>
                <td className="hidden px-3 py-2.5 lg:table-cell">
                  <CategoryBadge category={event.category} />
                </td>
                <td className="hidden px-3 py-2.5 xl:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {event.tag_names.slice(0, 3).map((tag) => (
                      <Link
                        key={tag}
                        href={`/explorer?tag=${encodeURIComponent(tag)}`}
                        className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                      >
                        {tag}
                      </Link>
                    ))}
                    {event.tag_names.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{event.tag_names.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 text-right text-xs text-muted-foreground lg:table-cell">
                  {formatDistanceToNow(new Date(event.event_timestamp), {
                    addSuffix: true,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
