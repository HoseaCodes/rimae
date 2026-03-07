import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { BookmarkCheck, Filter, Trash2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RIMAE_PROJECT_ID } from '@/lib/constants'
import { deleteSavedViewAction } from '@/lib/actions/views'
import type { FilterState } from '@/lib/database.types'

export const metadata: Metadata = { title: 'Saved Views' }
export const dynamic = 'force-dynamic'

export default async function SavedViewsPage() {
  const supabase = await createClient()
  const { data: views } = await supabase
    .from('saved_views')
    .select('id, name, description, filter_state, created_at')
    .eq('project_id', RIMAE_PROJECT_ID)
    .order('created_at', { ascending: false })

  const rows = (views ?? []) as {
    id: string
    name: string
    description: string | null
    filter_state: FilterState
    created_at: string
  }[]

  return (
    <div data-testid="views-page" className="mx-auto max-w-4xl space-y-6 px-6 py-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Saved Views</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Bookmarked filter combinations — click any view to load it in the Explorer.
        </p>
      </div>

      {rows.length === 0 ? (
        <div data-testid="views-empty" className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border">
          <BookmarkCheck size={24} className="text-muted-foreground/40" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No saved views yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the Save View button in the Explorer to bookmark a filter combination.
            </p>
          </div>
          <Link
            href="/explorer"
            className="mt-1 flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            Go to Explorer <ArrowRight size={11} />
          </Link>
        </div>
      ) : (
        <div data-testid="views-list" className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {rows.map((view) => {
            const fs = view.filter_state
            const chips = [
              fs.search    ? `"${fs.search}"`                 : null,
              fs.category  ? fs.category                       : null,
              fs.severity?.length ? fs.severity.join(', ')     : null,
              fs.status    ? fs.status                         : null,
            ].filter(Boolean) as string[]

            return (
              <div key={view.id} data-testid="view-item" data-view-id={view.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/10">
                <Filter size={14} className="shrink-0 text-muted-foreground/50" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/explorer?view=${view.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {view.name}
                    </Link>
                    <span className="text-xs text-muted-foreground/50">
                      {formatDistanceToNow(new Date(view.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {view.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{view.description}</p>
                  )}
                  {chips.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <form
                  action={async () => {
                    'use server'
                    await deleteSavedViewAction(view.id)
                  }}
                >
                  <button
                    type="submit"
                    className="shrink-0 rounded p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete view"
                  >
                    <Trash2 size={13} />
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
