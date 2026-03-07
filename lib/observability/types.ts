import type { EventCategory, EventSeverity, EventStatus } from '@/lib/database.types'

// ─── Time windows ─────────────────────────────────────────────────────────────

export type TimeWindow = '7d' | '30d' | '90d'

export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
}

export const TIME_WINDOW_DAYS: Record<TimeWindow, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

// ─── Chart data shapes ────────────────────────────────────────────────────────

/** One data point per date bucket for total event volume */
export interface FrequencyPoint {
  date: string   // "Dec 01" or "Dec W1" label
  dateKey: string // "2025-12-01" sortable
  count: number
}

/** Multi-series data point: date + one key per active category */
export interface CategoryPoint {
  date: string
  dateKey: string
  [category: string]: number | string
}

/** Multi-series data point: date + one key per severity level */
export interface SeverityPoint {
  date: string
  dateKey: string
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

export interface SummaryMetrics {
  totalLast7Days: number
  openIssues: number
  resolvedLast7Days: number
  criticalHighLast7Days: number
  openBlockers: number
  topCategoryThisWeek: EventCategory | null
  topCategoryThisWeekCount: number
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string
  title: string
  category: EventCategory
  severity: EventSeverity
  status: EventStatus
  event_timestamp: string
  summary: string | null
}

export interface TimelineDay {
  dateKey: string   // "2025-12-01"
  label: string     // "Thursday, Dec 1"
  events: TimelineEvent[]
}

// ─── Blockers ─────────────────────────────────────────────────────────────────

export interface BlockerEvent {
  id: string
  title: string
  category: EventCategory
  severity: EventSeverity
  status: EventStatus
  event_timestamp: string
  summary: string | null
}

// ─── Top topics ───────────────────────────────────────────────────────────────

export interface TopTopic {
  key: EventCategory
  label: string
  count: number
  trend: 'up' | 'neutral' // reserved for future comparison
}

// ─── Open vs Resolved ─────────────────────────────────────────────────────────

export interface HealthMetrics {
  open: number
  inProgress: number
  resolved: number
  archived: number
  wontFix: number
  total: number
  healthScore: number // 0–100: higher = healthier (resolved / total)
}

// ─── Aggregated chart datasets (all windows pre-computed server-side) ─────────

export interface ChartDatasets {
  frequency: Record<TimeWindow, FrequencyPoint[]>
  category: Record<TimeWindow, CategoryPoint[]>
  severity: Record<TimeWindow, SeverityPoint[]>
  activeCategories: EventCategory[] // top categories present in 90d window
}
