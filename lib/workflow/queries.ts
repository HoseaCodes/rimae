import { createClient } from '@/lib/supabase/server'
import type {
  FollowUpWithEvent,
  FollowUpStatus,
  EventWithMeta,
  LaunchChecklist,
  LaunchChecklistItem,
  ActionBoard,
} from '@/lib/database.types'

// ─── Follow-up queries ────────────────────────────────────────────────────────

export async function getFollowUpsForEvent(eventId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  return (data ?? []) as import('@/lib/database.types').FollowUp[]
}

export async function getFollowUpsWithEvent(opts?: {
  status?: FollowUpStatus | FollowUpStatus[]
  needs_decision?: boolean
  due_soon?: boolean
  overdue?: boolean
}) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('follow_ups_with_event')
    .select('*')

  if (opts?.status) {
    const statuses = Array.isArray(opts.status) ? opts.status : [opts.status]
    q = q.in('status', statuses)
  }

  if (opts?.needs_decision === true) {
    q = q.eq('needs_decision', true)
  }

  const now = new Date()
  if (opts?.due_soon) {
    const in7 = new Date(now)
    in7.setDate(in7.getDate() + 7)
    q = q
      .not('due_date', 'is', null)
      .lte('due_date', in7.toISOString())
      .gt('due_date', now.toISOString())
      .neq('status', 'done')
  }

  if (opts?.overdue) {
    q = q
      .not('due_date', 'is', null)
      .lt('due_date', now.toISOString())
      .neq('status', 'done')
  }

  q = q.order('created_at', { ascending: false })
  const { data } = await q
  return (data ?? []) as FollowUpWithEvent[]
}

export async function getWorkflowQueues() {
  const [open, blocked, needsDecision, dueSoon, overdue] = await Promise.all([
    getFollowUpsWithEvent({ status: ['backlog', 'ready', 'in_progress', 'in_review'] }),
    getFollowUpsWithEvent({ status: 'blocked' }),
    getFollowUpsWithEvent({ needs_decision: true }),
    getFollowUpsWithEvent({ due_soon: true }),
    getFollowUpsWithEvent({ overdue: true }),
  ])
  return { open, blocked, needsDecision, dueSoon, overdue }
}

export async function getWorkflowSummaryCounts() {
  const supabase = await createClient()
  const [openResult, blockedResult, decisionResult, pinnedResult] = await Promise.all([
    supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("done")'),
    supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'blocked'),
    supabase
      .from('follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('needs_decision', true)
      .neq('status', 'done'),
    supabase
      .from('event_pins')
      .select('*', { count: 'exact', head: true }),
  ])

  return {
    openFollowUps:    openResult.count     ?? 0,
    blockedFollowUps: blockedResult.count  ?? 0,
    needsDecision:    decisionResult.count ?? 0,
    pinnedEvents:     pinnedResult.count   ?? 0,
  }
}

// ─── Pin queries ──────────────────────────────────────────────────────────────

export async function isEventPinned(eventId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('event_pins')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle()
  return data !== null
}

export async function getPinnedEvents() {
  const supabase = await createClient()
  const { data: pins } = await supabase
    .from('event_pins')
    .select('event_id')
    .order('created_at', { ascending: false })
    .limit(10)

  if (!pins?.length) return []

  const ids = pins.map((p: { event_id: string }) => p.event_id)
  const { data } = await supabase
    .from('events_with_meta')
    .select('id, title, category, severity, status, event_timestamp, tag_names')
    .in('id', ids)

  return (data ?? []) as Pick<
    EventWithMeta,
    'id' | 'title' | 'category' | 'severity' | 'status' | 'event_timestamp' | 'tag_names'
  >[]
}

// ─── Checklist queries ────────────────────────────────────────────────────────

export async function getChecklists(projectId?: string): Promise<LaunchChecklist[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('launch_checklists')
    .select('*')
    .order('created_at', { ascending: false })
  if (projectId) q = q.eq('project_id', projectId)
  const { data } = await q
  return (data ?? []) as LaunchChecklist[]
}

export async function getChecklistWithItems(checklistId: string) {
  const supabase = await createClient()
  const [checklistResult, itemsResult] = await Promise.all([
    supabase.from('launch_checklists').select('*').eq('id', checklistId).single(),
    supabase
      .from('launch_checklist_items')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ])
  return {
    checklist: checklistResult.data as LaunchChecklist | null,
    items: (itemsResult.data ?? []) as LaunchChecklistItem[],
  }
}

export async function getAllChecklistsWithItems(projectId?: string) {
  const checklists = await getChecklists(projectId)
  const supabase = await createClient()
  if (!checklists.length) return []

  const { data: items } = await supabase
    .from('launch_checklist_items')
    .select('*')
    .in('checklist_id', checklists.map((c) => c.id))
    .order('sort_order', { ascending: true })

  const allItems = (items ?? []) as LaunchChecklistItem[]
  return checklists.map((c) => ({
    ...c,
    items: allItems.filter((i) => i.checklist_id === c.id),
  }))
}

// ─── Action board queries ─────────────────────────────────────────────────────

export async function getActionBoards(projectId?: string): Promise<ActionBoard[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('action_boards')
    .select('*')
    .order('created_at', { ascending: false })
  if (projectId) q = q.eq('project_id', projectId)
  const { data } = await q
  return (data ?? []) as ActionBoard[]
}

