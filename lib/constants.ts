import type { EventCategory, EventSeverity, EventStatus, EventType, SourceType } from '@/lib/database.types'

// ─── Category ─────────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  product_decision: 'Product Decision',
  bug: 'Bug',
  auth_oauth: 'Auth / OAuth',
  launch_blocker: 'Launch Blocker',
  beta_feedback: 'Beta Feedback',
  competitor_insight: 'Competitor Insight',
  pricing: 'Pricing',
  roadmap: 'Roadmap',
  app_store: 'App Store',
  marketing: 'Marketing',
  chat_log: 'Chat Log',
  general: 'General',
}

export const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = (
  Object.entries(CATEGORY_LABELS) as [EventCategory, string][]
).map(([value, label]) => ({ value, label }))

// ─── Severity ─────────────────────────────────────────────────────────────────

export const SEVERITY_LABELS: Record<EventSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
}

export const SEVERITY_ORDER: EventSeverity[] = ['critical', 'high', 'medium', 'low', 'info']

export const SEVERITY_OPTIONS: { value: EventSeverity; label: string }[] = SEVERITY_ORDER.map(
  (v) => ({ value: v, label: SEVERITY_LABELS[v] })
)

// Tailwind classes for severity badges
export const SEVERITY_STYLES: Record<EventSeverity, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  info: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
}

// ─── Status ───────────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<EventStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  archived: 'Archived',
  wont_fix: "Won't Fix",
}

export const STATUS_OPTIONS: { value: EventStatus; label: string }[] = (
  Object.entries(STATUS_LABELS) as [EventStatus, string][]
).map(([value, label]) => ({ value, label }))

export const STATUS_STYLES: Record<EventStatus, string> = {
  open: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  in_progress: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  archived: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  wont_fix: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
}

// ─── Event type ───────────────────────────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  decision: 'Decision',
  bug_note: 'Bug Note',
  feedback: 'Feedback',
  insight: 'Insight',
  blocker: 'Blocker',
  update: 'Update',
  reference: 'Reference',
  log: 'Log',
}

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = (
  Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]
).map(([value, label]) => ({ value, label }))

// ─── Source type ──────────────────────────────────────────────────────────────

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  chatgpt_web: 'ChatGPT',
  claude_web: 'Claude',
  manual: 'Manual',
  notion: 'Notion',
  slack: 'Slack',
  email: 'Email',
  document: 'Document',
  screenshot: 'Screenshot',
  external_url: 'External URL',
  other: 'Other',
}

export const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = (
  Object.entries(SOURCE_TYPE_LABELS) as [SourceType, string][]
).map(([value, label]) => ({ value, label }))

// ─── Project ──────────────────────────────────────────────────────────────────

export const RIMAE_PROJECT_ID = 'a1b2c3d4-0000-0000-0000-000000000001'
export const RIMAE_PROJECT_SLUG = 'rimae'
