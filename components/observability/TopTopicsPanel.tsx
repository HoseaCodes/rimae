import Link from 'next/link'
import type { TopTopic } from '@/lib/observability/types'

interface TopTopicsPanelProps {
  topics: TopTopic[]
}

export function TopTopicsPanel({ topics }: TopTopicsPanelProps) {
  if (topics.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
        No activity this week.
      </div>
    )
  }

  const max = topics[0].count

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Top Topics This Week</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Most active categories (last 7 days)</p>
      </div>
      <div className="divide-y divide-border">
        {topics.map((topic, i) => {
          const pct = max > 0 ? Math.round((topic.count / max) * 100) : 0
          const label = topic.label

          return (
            <Link
              key={topic.key}
              href={`/explorer?category=${topic.key}`}
              className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40"
            >
              <span className="w-4 text-[11px] text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground group-hover:text-foreground/90 truncate">
                    {label}
                  </span>
                  <span className="flex-shrink-0 text-xs font-semibold text-foreground">
                    {topic.count}
                  </span>
                </div>
                <div className="mt-1 h-1 w-full rounded-full bg-muted">
                  <div
                    className="h-1 rounded-full bg-primary/60 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
