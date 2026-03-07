import type { Metadata } from 'next'
import Link from 'next/link'
import { PlusCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RIMAE_PROJECT_ID } from '@/lib/constants'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { RecentEvents } from '@/components/dashboard/RecentEvents'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { SavedViewsList } from '@/components/dashboard/SavedViewsList'
import type { EventCategory, EventWithMeta, SavedView } from '@/lib/database.types'

export const metadata: Metadata = { title: 'Dashboard' }

// Disable static caching — data changes frequently
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // All queries in parallel for performance
  const [
    totalResult,
    openResult,
    criticalHighResult,
    resolvedResult,
    recentResult,
    categoryResult,
    viewsResult,
  ] = await Promise.all([
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', RIMAE_PROJECT_ID),

    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', RIMAE_PROJECT_ID)
      .eq('status', 'open'),

    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', RIMAE_PROJECT_ID)
      .in('severity', ['critical', 'high'])
      .eq('status', 'open'),

    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', RIMAE_PROJECT_ID)
      .eq('status', 'resolved'),

    supabase
      .from('events_with_meta')
      .select('id, title, category, severity, status, event_timestamp, source_name, tag_names')
      .eq('project_id', RIMAE_PROJECT_ID)
      .order('event_timestamp', { ascending: false })
      .limit(8),

    supabase
      .from('events')
      .select('category')
      .eq('project_id', RIMAE_PROJECT_ID),

    supabase
      .from('saved_views')
      .select('id, name, description')
      .eq('project_id', RIMAE_PROJECT_ID)
      .order('created_at'),
  ])

  const totalEvents = totalResult.count ?? 0
  const openEvents = openResult.count ?? 0
  const criticalHighOpen = criticalHighResult.count ?? 0
  const resolvedEvents = resolvedResult.count ?? 0

  // Aggregate category counts in JS (fine for this data volume)
  // Cast needed because Supabase partial-select inference does not propagate enum types
  const categoryCounts: Partial<Record<EventCategory, number>> = {}
  const categoryRows = (categoryResult.data ?? []) as { category: EventCategory }[]
  for (const row of categoryRows) {
    categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + 1
  }

  const recentEvents = (recentResult.data ?? []) as Pick<
    EventWithMeta,
    'id' | 'title' | 'category' | 'severity' | 'status' | 'event_timestamp' | 'source_name' | 'tag_names'
  >[]

  const savedViews = (viewsResult.data ?? []) as Pick<
    SavedView,
    'id' | 'name' | 'description'
  >[]

  return (
    <div data-testid="dashboard-page" className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 data-testid="dashboard-heading" className="text-xl font-semibold tracking-tight text-foreground">
            RIMAE Knowledge Base
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Project intelligence, decisions, and context — searchable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/explorer"
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-card/80 hover:text-foreground"
          >
            <Search size={14} />
            Explorer
          </Link>
          <Link
            href="/ingest"
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PlusCircle size={14} />
            Ingest Event
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid
        totalEvents={totalEvents}
        openEvents={openEvents}
        criticalHighOpen={criticalHighOpen}
        resolvedEvents={resolvedEvents}
      />

      {/* Main grid: recent events + category breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
        {/* Recent events */}
        <div data-testid="recent-events-section" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Recent Events
            </h2>
            <Link
              href="/explorer"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <RecentEvents events={recentEvents} />
        </div>

        {/* Category breakdown */}
        <div data-testid="category-section" className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            By Category
          </h2>
          <div className="rounded-lg border border-border bg-card p-4">
            <CategoryBreakdown
              counts={categoryCounts}
              total={totalEvents}
            />
          </div>
        </div>
      </div>

      {/* Saved views */}
      <div data-testid="saved-views-section" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Saved Views</h2>
          <Link
            href="/views"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Manage views
          </Link>
        </div>
        <SavedViewsList views={savedViews} />
      </div>
    </div>
  )
}
