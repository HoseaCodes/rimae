import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns'
import type { Event } from '@/lib/database.types'
import type {
  TimeWindow,
  FrequencyPoint,
  CategoryPoint,
  SeverityPoint,
  ChartDatasets,
  TimelineDay,
  TimelineEvent,
  HealthMetrics,
  TopTopic,
  SummaryMetrics,
  BlockerEvent,
} from './types'
import { TIME_WINDOW_DAYS } from './types'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { EventCategory, EventSeverity } from '@/lib/database.types'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function toDateLabel(date: Date): string {
  return format(date, 'MMM d')
}

function generateDayBuckets(days: number): { dateKey: string; date: Date; label: string }[] {
  const today = startOfDay(new Date())
  const start = subDays(today, days - 1)
  return eachDayOfInterval({ start, end: today }).map((d) => ({
    dateKey: toDateKey(d),
    date: d,
    label: toDateLabel(d),
  }))
}

function eventDateKey(event: Pick<Event, 'event_timestamp'>): string {
  return format(parseISO(event.event_timestamp), 'yyyy-MM-dd')
}

// ─── Frequency chart ──────────────────────────────────────────────────────────

export function buildFrequencyData(
  events: Pick<Event, 'event_timestamp'>[],
  days: number
): FrequencyPoint[] {
  const buckets = generateDayBuckets(days)
  const countMap: Record<string, number> = {}
  for (const b of buckets) countMap[b.dateKey] = 0

  for (const e of events) {
    const key = eventDateKey(e)
    if (key in countMap) countMap[key]++
  }

  return buckets.map((b) => ({
    date: b.label,
    dateKey: b.dateKey,
    count: countMap[b.dateKey],
  }))
}

// ─── Category trend ───────────────────────────────────────────────────────────

export function buildCategoryData(
  events: Pick<Event, 'event_timestamp' | 'category'>[],
  days: number,
  topCategories: EventCategory[]
): CategoryPoint[] {
  const buckets = generateDayBuckets(days)

  // Initialize empty
  const map: Record<string, CategoryPoint> = {}
  for (const b of buckets) {
    const point: CategoryPoint = { date: b.label, dateKey: b.dateKey }
    for (const cat of topCategories) point[cat] = 0
    map[b.dateKey] = point
  }

  for (const e of events) {
    const key = eventDateKey(e)
    if (key in map && topCategories.includes(e.category as EventCategory)) {
      ;(map[key][e.category] as number)++
    }
  }

  return buckets.map((b) => map[b.dateKey])
}

// ─── Severity trend ───────────────────────────────────────────────────────────

export function buildSeverityData(
  events: Pick<Event, 'event_timestamp' | 'severity'>[],
  days: number
): SeverityPoint[] {
  const buckets = generateDayBuckets(days)
  const map: Record<string, SeverityPoint> = {}
  for (const b of buckets) {
    map[b.dateKey] = { date: b.label, dateKey: b.dateKey, critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  }

  for (const e of events) {
    const key = eventDateKey(e)
    if (key in map) {
      const sev = e.severity as EventSeverity
      if (sev in map[key]) (map[key][sev] as number)++
    }
  }

  return buckets.map((b) => map[b.dateKey])
}

// ─── Top categories (for chart series selection) ──────────────────────────────

export function getTopCategories(
  events: Pick<Event, 'category'>[],
  limit = 6
): EventCategory[] {
  const counts: Partial<Record<EventCategory, number>> = {}
  for (const e of events) {
    counts[e.category as EventCategory] = (counts[e.category as EventCategory] ?? 0) + 1
  }
  return (Object.entries(counts) as [EventCategory, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([cat]) => cat)
}

// ─── Build all chart datasets ─────────────────────────────────────────────────

export function buildChartDatasets(
  events90d: Pick<Event, 'event_timestamp' | 'category' | 'severity'>[]
): ChartDatasets {
  const windows: TimeWindow[] = ['7d', '30d', '90d']

  const topCategories = getTopCategories(events90d)

  // Slice events per window
  const sliced: Record<TimeWindow, typeof events90d> = {
    '7d': [],
    '30d': [],
    '90d': events90d,
  }

  const today = startOfDay(new Date())
  for (const e of events90d) {
    const key = eventDateKey(e)
    const days = Math.floor(
      (today.getTime() - parseISO(key).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (days < 7) sliced['7d'].push(e)
    if (days < 30) sliced['30d'].push(e)
  }

  const frequency: Record<TimeWindow, FrequencyPoint[]> = {
    '7d': buildFrequencyData(sliced['7d'], 7),
    '30d': buildFrequencyData(sliced['30d'], 30),
    '90d': buildFrequencyData(events90d, 90),
  }

  const category: Record<TimeWindow, CategoryPoint[]> = {
    '7d': buildCategoryData(sliced['7d'], 7, topCategories),
    '30d': buildCategoryData(sliced['30d'], 30, topCategories),
    '90d': buildCategoryData(events90d, 90, topCategories),
  }

  const severity: Record<TimeWindow, SeverityPoint[]> = {
    '7d': buildSeverityData(sliced['7d'], 7),
    '30d': buildSeverityData(sliced['30d'], 30),
    '90d': buildSeverityData(events90d, 90),
  }

  return { frequency, category, severity, activeCategories: topCategories }
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export function buildTimeline(
  events: TimelineEvent[]
): TimelineDay[] {
  const dayMap: Map<string, TimelineDay> = new Map()

  for (const e of events) {
    const d = parseISO(e.event_timestamp)
    const key = toDateKey(d)
    if (!dayMap.has(key)) {
      dayMap.set(key, {
        dateKey: key,
        label: format(d, 'EEEE, MMM d'),
        events: [],
      })
    }
    dayMap.get(key)!.events.push(e)
  }

  // Sort days descending, events within each day descending
  return Array.from(dayMap.values())
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .map((day) => ({
      ...day,
      events: day.events.sort(
        (a, b) =>
          new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime()
      ),
    }))
}

// ─── Health metrics ───────────────────────────────────────────────────────────

export function buildHealthMetrics(
  events: Pick<Event, 'status'>[]
): HealthMetrics {
  const counts = { open: 0, inProgress: 0, resolved: 0, archived: 0, wontFix: 0 }
  for (const e of events) {
    if (e.status === 'open') counts.open++
    else if (e.status === 'in_progress') counts.inProgress++
    else if (e.status === 'resolved') counts.resolved++
    else if (e.status === 'archived') counts.archived++
    else if (e.status === 'wont_fix') counts.wontFix++
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const healthScore = total > 0 ? Math.round(((counts.resolved + counts.wontFix + counts.archived) / total) * 100) : 0
  return { ...counts, total, healthScore }
}

// ─── Top topics ───────────────────────────────────────────────────────────────

export function buildTopTopics(
  events7d: Pick<Event, 'category'>[],
  limit = 8
): TopTopic[] {
  const counts: Partial<Record<EventCategory, number>> = {}
  for (const e of events7d) {
    counts[e.category as EventCategory] = (counts[e.category as EventCategory] ?? 0) + 1
  }
  return (Object.entries(counts) as [EventCategory, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({
      key,
      label: CATEGORY_LABELS[key],
      count,
      trend: 'neutral' as const,
    }))
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

export function buildSummaryMetrics(
  events7d: Pick<Event, 'severity' | 'status'>[],
  allEvents: Pick<Event, 'status'>[],
  topTopics: TopTopic[],
  openBlockers: BlockerEvent[]
): SummaryMetrics {
  const totalLast7Days = events7d.length
  const openIssues = allEvents.filter((e) => e.status === 'open' || e.status === 'in_progress').length
  const resolvedLast7Days = events7d.filter((e) => e.status === 'resolved').length
  const criticalHighLast7Days = events7d.filter((e) => e.severity === 'critical' || e.severity === 'high').length

  return {
    totalLast7Days,
    openIssues,
    resolvedLast7Days,
    criticalHighLast7Days,
    openBlockers: openBlockers.length,
    topCategoryThisWeek: topTopics[0]?.key ?? null,
    topCategoryThisWeekCount: topTopics[0]?.count ?? 0,
  }
}
