import type { Metadata } from 'next'
import Link from 'next/link'
import { PlusCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getActiveProjectId, getActiveProject } from '@/lib/project-context'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { RecentEvents } from '@/components/dashboard/RecentEvents'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { SavedViewsList } from '@/components/dashboard/SavedViewsList'
import { WorkflowSummaryCards } from '@/components/dashboard/WorkflowSummaryCards'
import { getWorkflowSummaryCounts, getPinnedEvents } from '@/lib/workflow/queries'
import type { EventCategory, EventWithMeta, SavedView } from '@/lib/database.types'

export const metadata: Metadata = { title: 'Dashboard' }

// Disable static caching — data changes frequently
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const projectId = await getActiveProjectId()

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
      .eq('project_id', projectId),

    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'open'),

    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .in('severity', ['critical', 'high'])
      .eq('status', 'open'),

    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'resolved'),

    supabase
      .from('events_with_meta')
      .select('id, title, category, severity, status, event_timestamp, source_name, tag_names')
      .eq('project_id', projectId)
      .order('event_timestamp', { ascending: false })
      .limit(8),

    supabase
      .from('events')
      .select('category')
      .eq('project_id', projectId),

    supabase
      .from('saved_views')
      .select('id, name, description')
      .eq('project_id', projectId)
      .order('created_at'),
  ])

  // Workflow summary + active project name — separate from Supabase tuple
  const [workflowCounts, pinnedEvents, activeProject] = await Promise.all([
    getWorkflowSummaryCounts(),
    getPinnedEvents(),
    getActiveProject(),
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
            {activeProject?.name ?? 'RIMAE'} Knowledge Base
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

      {/* Workflow summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Workflow</h2>
          <Link href="/workflow" className="text-xs text-muted-foreground hover:text-foreground">
            View queues
          </Link>
        </div>
        <WorkflowSummaryCards
          openFollowUps={workflowCounts.openFollowUps}
          blockedFollowUps={workflowCounts.blockedFollowUps}
          needsDecision={workflowCounts.needsDecision}
          pinnedEvents={workflowCounts.pinnedEvents}
        />
      </div>

      {/* Pinned events */}
      {pinnedEvents.length > 0 && (
        <div id="pinned" className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Pinned Events</h2>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {pinnedEvents.map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1 truncate text-foreground/85">{ev.title}</span>
                <span className="flex-shrink-0 text-[11px] text-amber-400">Pinned</span>
              </Link>
            ))}
          </div>
        </div>
      )}

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
