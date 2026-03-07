import { createClient } from '@/lib/supabase/server'
import { RIMAE_PROJECT_ID } from '@/lib/constants'
import {
  buildChartDatasets,
  buildTimeline,
  buildHealthMetrics,
  buildTopTopics,
  buildSummaryMetrics,
} from './formatters'
import type { TimelineEvent, BlockerEvent } from './types'
import type { Event, EventCategory, EventSeverity, EventStatus } from '@/lib/database.types'

// ─── Fetch all observability data in parallel ─────────────────────────────────

export async function fetchObservabilityData() {
  const supabase = await createClient()

  const [events90dResult, allEventsResult, timelineResult, blockersResult] =
    await Promise.all([
      // Chart data: 90-day window — category + severity + timestamp only
      supabase
        .from('events')
        .select('event_timestamp, category, severity')
        .eq('project_id', RIMAE_PROJECT_ID)
        .gte('event_timestamp', nDaysAgo(90))
        .order('event_timestamp', { ascending: true }),

      // All events for health metrics (status only)
      supabase
        .from('events')
        .select('status')
        .eq('project_id', RIMAE_PROJECT_ID),

      // Timeline: last 30 days, full event fields
      supabase
        .from('events')
        .select('id, title, category, severity, status, event_timestamp, summary')
        .eq('project_id', RIMAE_PROJECT_ID)
        .gte('event_timestamp', nDaysAgo(30))
        .order('event_timestamp', { ascending: false })
        .limit(60),

      // Launch blockers: open events that are launch_blocker category OR critical severity OR event_type = 'blocker'
      supabase
        .from('events')
        .select('id, title, category, severity, status, event_timestamp, summary')
        .eq('project_id', RIMAE_PROJECT_ID)
        .or(
          `category.eq.launch_blocker,severity.eq.critical,event_type.eq.blocker`
        )
        .not('status', 'in', '("resolved","archived","wont_fix")')
        .order('severity', { ascending: true }) // critical first (alphabetically reversed — sort client-side)
        .order('event_timestamp', { ascending: false }),
    ])

  const events90d = (events90dResult.data ?? []) as Pick<Event, 'event_timestamp' | 'category' | 'severity'>[]
  const allEvents = (allEventsResult.data ?? []) as Pick<Event, 'status'>[]
  const timelineRaw = (timelineResult.data ?? []) as TimelineEvent[]
  const blockersRaw = (blockersResult.data ?? []) as BlockerEvent[]

  // 7d slice for topics + summary
  const sevenDaysAgo = nDaysAgo(7)
  const events7d = events90d.filter((e) => e.event_timestamp >= sevenDaysAgo) as Pick<
    Event,
    'event_timestamp' | 'category' | 'severity' | 'status'
  >[]

  // Build aggregated chart data
  const chartDatasets = buildChartDatasets(events90d)

  // Build timeline grouped by day
  const timeline = buildTimeline(timelineRaw)

  // Health
  const health = buildHealthMetrics(allEvents)

  // Top topics this week (category-based)
  const topTopics = buildTopTopics(events7d)

  // Sort blockers: critical > high > medium > low
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  const openBlockers = blockersRaw
    .filter((b) => b.status === 'open' || b.status === 'in_progress')
    .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))

  const recentlyResolvedBlockers = blockersRaw
    .filter((b) => b.status === 'resolved')
    .slice(0, 5)

  // Summary cards
  const summary = buildSummaryMetrics(
    events7d as Pick<Event, 'severity' | 'status'>[],
    allEvents,
    topTopics,
    openBlockers
  )

  return {
    summary,
    chartDatasets,
    timeline,
    health,
    topTopics,
    openBlockers,
    recentlyResolvedBlockers,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
