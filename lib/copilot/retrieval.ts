// ─── Knowledge Copilot — retrieval layer ─────────────────────────────────────
// Gathers relevant records from the DB based on question type + scope.
// All queries are server-side only.

import { createClient } from '@/lib/supabase/server'
import type { QuestionType } from './types'
import type { EventWithMeta, FollowUpWithEvent, LaunchChecklistItem } from '@/lib/database.types'

const MAX_EVENTS = 10
const MAX_FOLLOW_UPS = 8
const MAX_CHECKLIST_ITEMS = 6

export interface RetrievedContext {
  events: EventWithMeta[]
  followUps: FollowUpWithEvent[]
  checklistItems: LaunchChecklistItem[]
}

export async function retrieveContext(
  question: string,
  questionType: QuestionType,
  projectId: string,
  opts?: { dateFrom?: string; dateTo?: string }
): Promise<RetrievedContext> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const [events, followUps, checklistItems] = await Promise.all([
    fetchEvents(supabase, question, questionType, projectId, opts),
    fetchFollowUps(supabase, questionType),
    fetchChecklistItems(supabase, questionType),
  ])

  return { events, followUps, checklistItems }
}

// ─── Briefing-specific retrieval ─────────────────────────────────────────────
// Uses a wider net: recent events by severity + full workflow state.

export async function retrieveBriefingContext(projectId: string): Promise<RetrievedContext> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)

  const [eventsResult, followUpsResult, checklistResult] = await Promise.all([
    supabase
      .from('events_with_meta')
      .select('id, title, summary, category, severity, status, event_type, event_timestamp, tag_names, source_name, project_id')
      .eq('project_id', projectId)
      .gte('event_timestamp', cutoff.toISOString())
      .in('severity', ['critical', 'high', 'medium'])
      .order('severity', { ascending: true })
      .order('event_timestamp', { ascending: false })
      .limit(MAX_EVENTS),

    supabase
      .from('follow_ups_with_event')
      .select('*')
      .not('status', 'in', '("done")')
      .order('created_at', { ascending: false })
      .limit(MAX_FOLLOW_UPS),

    supabase
      .from('launch_checklist_items')
      .select('*')
      .in('status', ['backlog', 'in_progress', 'blocked'])
      .order('sort_order', { ascending: true })
      .limit(MAX_CHECKLIST_ITEMS),
  ])

  return {
    events: (eventsResult.data ?? []) as EventWithMeta[],
    followUps: (followUpsResult.data ?? []) as FollowUpWithEvent[],
    checklistItems: (checklistResult.data ?? []) as LaunchChecklistItem[],
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  question: string,
  questionType: QuestionType,
  projectId: string,
  opts?: { dateFrom?: string; dateTo?: string }
): Promise<EventWithMeta[]> {
  let q = supabase
    .from('events_with_meta')
    .select('id, title, summary, category, severity, status, event_type, event_timestamp, tag_names, source_name, project_id')
    .eq('project_id', projectId)
    .order('event_timestamp', { ascending: false })

  // Date filtering
  if (opts?.dateFrom) q = q.gte('event_timestamp', opts.dateFrom)
  if (opts?.dateTo) q = q.lte('event_timestamp', opts.dateTo)

  // Category + status filters per question type
  if (questionType === 'blocker_summary') {
    q = q
      .in('category', ['launch_blocker', 'bug', 'auth_oauth'])
      .in('status', ['open', 'in_progress'])
  } else if (questionType === 'issue_summary') {
    q = q.in('category', ['bug', 'auth_oauth', 'launch_blocker'])
  } else if (questionType === 'decision_why') {
    q = q.in('category', ['product_decision', 'pricing', 'roadmap'])
  }

  // FTS — try keyword search; fall back to recency-ordered if no results
  const keywords = extractKeywords(question, questionType)
  if (keywords) {
    const { data: ftsData } = await q
      .textSearch('search_vector', keywords, { type: 'websearch', config: 'english' })
      .limit(MAX_EVENTS)

    if (ftsData && ftsData.length > 0) {
      return ftsData as EventWithMeta[]
    }
  }

  // Fallback: return most-recent events with any category filters applied
  const { data: fallback } = await q.limit(MAX_EVENTS)
  return (fallback ?? []) as EventWithMeta[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFollowUps(supabase: any, questionType: QuestionType): Promise<FollowUpWithEvent[]> {
  const needsFollowUps = ['briefing_today', 'blocker_summary', 'open_questions', 'current_status'].includes(questionType)
  if (!needsFollowUps) return []

  let q = supabase
    .from('follow_ups_with_event')
    .select('*')
    .not('status', 'in', '("done")')
    .order('created_at', { ascending: false })
    .limit(MAX_FOLLOW_UPS)

  if (questionType === 'blocker_summary') {
    q = supabase
      .from('follow_ups_with_event')
      .select('*')
      .eq('status', 'blocked')
      .order('created_at', { ascending: false })
      .limit(MAX_FOLLOW_UPS)
  }

  if (questionType === 'open_questions') {
    q = supabase
      .from('follow_ups_with_event')
      .select('*')
      .eq('needs_decision', true)
      .neq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(MAX_FOLLOW_UPS)
  }

  const { data } = await q
  return (data ?? []) as FollowUpWithEvent[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchChecklistItems(supabase: any, questionType: QuestionType): Promise<LaunchChecklistItem[]> {
  const needsChecklists = ['briefing_today', 'blocker_summary', 'current_status'].includes(questionType)
  if (!needsChecklists) return []

  const { data } = await supabase
    .from('launch_checklist_items')
    .select('*')
    .in('status', ['backlog', 'in_progress', 'blocked'])
    .order('sort_order', { ascending: true })
    .limit(MAX_CHECKLIST_ITEMS)

  return (data ?? []) as LaunchChecklistItem[]
}

/**
 * Extract meaningful search keywords from a question, dropping stop words.
 * Returns empty string if nothing meaningful remains (triggers fallback).
 */
function extractKeywords(question: string, questionType: QuestionType): string {
  // Briefing questions don't benefit from keyword search — handled separately
  if (questionType === 'briefing_today') return ''

  const STOP_WORDS = new Set([
    'what', 'why', 'how', 'when', 'where', 'which', 'who', 'were', 'was',
    'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'for', 'in', 'on',
    'at', 'to', 'of', 'did', 'do', 'does', 'all', 'any', 'main', 'some',
    'our', 'my', 'with', 'from', 'last', 'this', 'that', 'these', 'those',
    'can', 'could', 'would', 'should', 'have', 'has', 'had', 'been', 'be',
    'by', 'me', 'us', 'give', 'generate', 'summarize', 'list', 'show',
    'tell', 'find', 'get', 'please', 'about', 'into', 'over', 'since',
    'most', 'recent', 'during', 'up', 'out', 'its',
  ])

  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 8)

  return words.join(' ')
}
