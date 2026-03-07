import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { RIMAE_PROJECT_ID } from '@/lib/constants'
import { ExplorerFilters } from '@/components/explorer/ExplorerFilters'
import { EventsTable } from '@/components/explorer/EventsTable'
import type { ExplorerEvent } from '@/components/explorer/EventsTable'
import { SaveViewButton } from '@/components/explorer/SaveViewButton'
import { ExportButton } from '@/components/explorer/ExportButton'
import type { EventCategory, EventSeverity, EventStatus, SourceType, FilterState, SavedView } from '@/lib/database.types'

export const metadata: Metadata = { title: 'Explorer' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function getString(val: string | string[] | undefined): string {
  return typeof val === 'string' ? val : ''
}

export default async function ExplorerPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Parse URL params
  const search = getString(params.q)
  const category = getString(params.category)
  const severity = getString(params.severity)
  const status = getString(params.status)
  const sourceType = getString(params.source_type)
  const dateFrom = getString(params.date_from)
  const dateTo = getString(params.date_to)
  const tag = getString(params.tag)
  const sort = getString(params.sort) || 'event_timestamp'
  const dir = getString(params.dir) || 'desc'
  const viewId = getString(params.view)

  // Effective filters (may be overridden by saved view if URL params not set)
  let effectiveSearch = search
  let effectiveCategory = category
  let effectiveSeverity = severity
  let effectiveStatus = status
  let effectiveSourceType = sourceType
  let effectiveDateFrom = dateFrom
  let effectiveDateTo = dateTo
  let effectiveTag = tag
  let activeView: Pick<SavedView, 'id' | 'name'> | undefined

  // Load saved view and merge filter_state (URL params take precedence)
  if (viewId) {
    const { data: view } = await supabase
      .from('saved_views')
      .select('id, name, filter_state')
      .eq('id', viewId)
      .single()

    if (view) {
      const v = view as { id: string; name: string; filter_state: FilterState }
      activeView = { id: v.id, name: v.name }
      const fs = v.filter_state
      if (!search && fs.search) effectiveSearch = fs.search
      if (!category && fs.category) effectiveCategory = fs.category
      if (!severity && fs.severity?.length) effectiveSeverity = fs.severity[0]
      if (!status && fs.status) effectiveStatus = fs.status
    }
  }

  // Validate sort field to prevent injection
  const VALID_SORT_FIELDS: Record<string, string> = {
    event_timestamp: 'event_timestamp',
    updated_at: 'updated_at',
  }
  const sortField = VALID_SORT_FIELDS[sort] ?? 'event_timestamp'
  const ascending = dir === 'asc'

  // Build and execute the query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('events_with_meta')
    .select(
      'id, title, summary, category, severity, status, event_type, event_timestamp, source_name, source_type, tag_names',
      { count: 'exact' }
    )
    .eq('project_id', RIMAE_PROJECT_ID)

  if (effectiveSearch) {
    query = query.textSearch('search_vector', effectiveSearch, {
      type: 'plain',
      config: 'english',
    })
  }
  if (effectiveCategory) {
    query = query.eq('category', effectiveCategory as EventCategory)
  }
  if (effectiveSeverity) {
    query = query.eq('severity', effectiveSeverity as EventSeverity)
  }
  if (effectiveStatus) {
    query = query.eq('status', effectiveStatus as EventStatus)
  }
  if (effectiveSourceType) {
    query = query.eq('source_type', effectiveSourceType as SourceType)
  }
  if (effectiveDateFrom) {
    query = query.gte('event_timestamp', effectiveDateFrom)
  }
  if (effectiveDateTo) {
    // Add one day to make the 'to' date inclusive
    const toDate = new Date(effectiveDateTo)
    toDate.setDate(toDate.getDate() + 1)
    query = query.lt('event_timestamp', toDate.toISOString())
  }
  if (effectiveTag) {
    query = query.contains('tag_names', [effectiveTag])
  }

  query = query.order(sortField, { ascending }).limit(100)

  const { data: eventsRaw, count: totalCount } = await query
  const events = (eventsRaw ?? []) as ExplorerEvent[]

  const hasFilters = !!(effectiveSearch || effectiveCategory || effectiveSeverity ||
    effectiveStatus || effectiveSourceType || effectiveDateFrom || effectiveDateTo || effectiveTag)

  return (
    <div data-testid="explorer-page" className="mx-auto max-w-6xl space-y-4 px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {activeView ? activeView.name : 'Event Explorer'}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {activeView
              ? 'Saved view — modify filters to explore further'
              : 'Search and filter RIMAE project events'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton events={events} />
          <SaveViewButton
            filterState={{
              search: effectiveSearch || undefined,
              category: (effectiveCategory as FilterState['category']) || undefined,
              severity: effectiveSeverity ? [effectiveSeverity as never] : undefined,
              status: (effectiveStatus as FilterState['status']) || undefined,
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-8 animate-pulse rounded bg-muted" />}>
        <ExplorerFilters
          initialSearch={effectiveSearch}
          initialCategory={effectiveCategory}
          initialSeverity={effectiveSeverity}
          initialStatus={effectiveStatus}
          initialSourceType={effectiveSourceType}
          initialDateFrom={effectiveDateFrom}
          initialDateTo={effectiveDateTo}
          initialTag={effectiveTag}
          initialSort={sortField}
          initialDir={dir}
          activeView={activeView}
        />
      </Suspense>

      {/* Results */}
      <EventsTable events={events} totalCount={totalCount ?? 0} />
    </div>
  )
}
