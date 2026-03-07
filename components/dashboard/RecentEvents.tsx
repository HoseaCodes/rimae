import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import type { EventWithMeta } from '@/lib/database.types'

interface RecentEventsProps {
  events: Pick<
    EventWithMeta,
    'id' | 'title' | 'category' | 'severity' | 'status' | 'event_timestamp' | 'source_name' | 'tag_names'
  >[]
}

export function RecentEvents({ events }: RecentEventsProps) {
  if (events.length === 0) {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No events yet. Ingest your first event to get started.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Event
            </th>
            <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground sm:table-cell">
              Category
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Severity
            </th>
            <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground md:table-cell">
              Status
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
              className="group transition-colors hover:bg-muted/30"
            >
              <td className="px-3 py-2.5">
                <Link
                  href={`/events/${event.id}`}
                  className="block max-w-xs truncate font-medium text-foreground group-hover:text-primary"
                >
                  {event.title}
                </Link>
                {event.source_name && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {event.source_name}
                  </p>
                )}
              </td>
              <td className="hidden px-3 py-2.5 sm:table-cell">
                <CategoryBadge category={event.category} />
              </td>
              <td className="px-3 py-2.5">
                <SeverityBadge severity={event.severity} />
              </td>
              <td className="hidden px-3 py-2.5 md:table-cell">
                <StatusBadge status={event.status} />
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
  )
}
