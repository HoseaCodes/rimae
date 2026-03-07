import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import type { SavedView } from '@/lib/database.types'

interface SavedViewsListProps {
  views: Pick<SavedView, 'id' | 'name' | 'description'>[]
}

export function SavedViewsList({ views }: SavedViewsListProps) {
  if (views.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No saved views yet. Create one from the Explorer.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {views.map((view) => (
        <Link
          key={view.id}
          href={`/explorer?view=${view.id}`}
          className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-card/80 hover:text-foreground"
          title={view.description ?? undefined}
        >
          <Bookmark size={11} className="text-muted-foreground" />
          {view.name}
        </Link>
      ))}
    </div>
  )
}
