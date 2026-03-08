import { createClient } from '@/lib/supabase/server'
import type { Project, EventWithMeta } from '@/lib/database.types'

// ─── Project listing ──────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('name')
  return (data ?? []) as Project[]
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  return data as Project | null
}

// ─── Org-level aggregate stats ────────────────────────────────────────────────

export interface OrgStats {
  projectCount: number
  totalEvents: number
  openEvents: number
  openFollowUps: number
  blockedFollowUps: number
  needsDecision: number
  pinnedEvents: number
}

export async function getOrgStats(): Promise<OrgStats> {
  const supabase = await createClient()

  const [
    projectsResult,
    totalEventsResult,
    openEventsResult,
    followUpsResult,
    blockedResult,
    decisionResult,
    pinnedResult,
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('follow_ups').select('*', { count: 'exact', head: true }).not('status', 'in', '("done")'),
    supabase.from('follow_ups').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
    supabase.from('follow_ups').select('*', { count: 'exact', head: true }).eq('needs_decision', true).neq('status', 'done'),
    supabase.from('event_pins').select('*', { count: 'exact', head: true }),
  ])

  return {
    projectCount:    projectsResult.count    ?? 0,
    totalEvents:     totalEventsResult.count ?? 0,
    openEvents:      openEventsResult.count  ?? 0,
    openFollowUps:   followUpsResult.count   ?? 0,
    blockedFollowUps: blockedResult.count    ?? 0,
    needsDecision:   decisionResult.count    ?? 0,
    pinnedEvents:    pinnedResult.count      ?? 0,
  }
}

// ─── Per-project breakdowns ───────────────────────────────────────────────────

export interface ProjectStat {
  project: Project
  eventCount: number
  openCount: number
  criticalHighCount: number
}

export async function getPerProjectStats(): Promise<ProjectStat[]> {
  const supabase = await createClient()
  const projects = await getProjects()
  if (!projects.length) return []

  const [allEventsResult, openEventsResult, critHighResult] = await Promise.all([
    supabase.from('events').select('project_id'),
    supabase.from('events').select('project_id').eq('status', 'open'),
    supabase.from('events').select('project_id').in('severity', ['critical', 'high']).eq('status', 'open'),
  ])

  const allEvents  = (allEventsResult.data  ?? []) as { project_id: string }[]
  const openEvents = (openEventsResult.data ?? []) as { project_id: string }[]
  const critHigh   = (critHighResult.data   ?? []) as { project_id: string }[]

  return projects.map((project) => ({
    project,
    eventCount:       allEvents.filter((e) => e.project_id === project.id).length,
    openCount:        openEvents.filter((e) => e.project_id === project.id).length,
    criticalHighCount: critHigh.filter((e) => e.project_id === project.id).length,
  }))
}

// ─── Cross-project recent activity ───────────────────────────────────────────

export type CrossProjectEvent = Pick<
  EventWithMeta,
  'id' | 'title' | 'category' | 'severity' | 'status' | 'event_timestamp' | 'source_name' | 'tag_names'
> & { project_id: string }

export async function getRecentEventsAllProjects(limit = 12): Promise<CrossProjectEvent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events_with_meta')
    .select('id, title, category, severity, status, event_timestamp, source_name, tag_names, project_id')
    .order('event_timestamp', { ascending: false })
    .limit(limit)
  return (data ?? []) as CrossProjectEvent[]
}
