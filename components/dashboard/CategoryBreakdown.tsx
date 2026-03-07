import Link from 'next/link'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { EventCategory } from '@/lib/database.types'

interface CategoryBreakdownProps {
  counts: Partial<Record<EventCategory, number>>
  total: number
}

export function CategoryBreakdown({ counts, total }: CategoryBreakdownProps) {
  const sorted = (Object.entries(counts) as [EventCategory, number][]).sort(
    (a, b) => b[1] - a[1]
  )

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No data yet.</p>
    )
  }

  return (
    <ul className="space-y-2">
      {sorted.map(([category, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <li key={category}>
            <Link
              href={`/explorer?category=${category}`}
              className="group block"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/50 transition-all group-hover:bg-primary/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
