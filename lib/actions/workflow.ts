'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveProjectId } from '@/lib/project-context'
import {
  FollowUpSchema,
  FollowUpUpdateSchema,
  FollowUpStatusSchema,
  ChecklistSchema,
  ChecklistItemSchema,
  ActionBoardSchema,
} from '@/lib/schemas'
import type { ActionResult, FollowUpValues, FollowUpUpdateValues, ChecklistValues, ChecklistItemValues, ActionBoardValues } from '@/lib/schemas'
import type { FollowUpStatus, ChecklistItemStatus } from '@/lib/database.types'

// ─── Follow-up actions ────────────────────────────────────────────────────────

export async function createFollowUpAction(
  values: FollowUpValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = FollowUpSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const d = parsed.data

  const { data, error } = await supabase
    .from('follow_ups')
    .insert({
      event_id:       d.event_id,
      title:          d.title,
      description:    d.description || null,
      assignee:       d.assignee || null,
      priority:       d.priority,
      status:         d.status,
      due_date:       d.due_date ? new Date(d.due_date).toISOString() : null,
      needs_decision: d.needs_decision,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: `Database error: ${error.message}` }

  revalidatePath(`/events/${d.event_id}`)
  revalidatePath('/workflow')

  return { success: true, data: { id: (data as { id: string }).id } }
}

export async function updateFollowUpAction(
  followUpId: string,
  values: FollowUpUpdateValues
): Promise<ActionResult<undefined>> {
  const parsed = FollowUpUpdateSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: 'Validation failed' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const d = parsed.data
  const update: Record<string, unknown> = {}

  if (d.title !== undefined)          update.title          = d.title
  if (d.description !== undefined)    update.description    = d.description || null
  if (d.assignee !== undefined)       update.assignee       = d.assignee || null
  if (d.priority !== undefined)       update.priority       = d.priority
  if (d.status !== undefined)         update.status         = d.status
  if (d.due_date !== undefined)       update.due_date       = d.due_date ? new Date(d.due_date).toISOString() : null
  if (d.needs_decision !== undefined) update.needs_decision = d.needs_decision

  const { error } = await supabase.from('follow_ups').update(update).eq('id', followUpId)
  if (error) return { success: false, error: `Database error: ${error.message}` }

  // We need the event_id to revalidate the event page — fetch it first
  const { data: fu } = await supabase.from('follow_ups').select('event_id').eq('id', followUpId).single()
  if (fu) revalidatePath(`/events/${(fu as { event_id: string }).event_id}`)
  revalidatePath('/workflow')

  return { success: true, data: undefined }
}

export async function updateFollowUpStatusAction(
  followUpId: string,
  status: FollowUpStatus
): Promise<ActionResult<undefined>> {
  const parsed = FollowUpStatusSchema.safeParse({ status })
  if (!parsed.success) return { success: false, error: 'Invalid status value' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data: fu, error: fetchErr } = await supabase
    .from('follow_ups').select('event_id').eq('id', followUpId).single()
  if (fetchErr) return { success: false, error: `Not found: ${fetchErr.message}` }

  const { error } = await supabase
    .from('follow_ups').update({ status: parsed.data.status }).eq('id', followUpId)
  if (error) return { success: false, error: `Database error: ${error.message}` }

  revalidatePath(`/events/${(fu as { event_id: string }).event_id}`)
  revalidatePath('/workflow')

  return { success: true, data: undefined }
}

export async function deleteFollowUpAction(
  followUpId: string
): Promise<ActionResult<undefined>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data: fu } = await supabase
    .from('follow_ups').select('event_id').eq('id', followUpId).single()

  const { error } = await supabase.from('follow_ups').delete().eq('id', followUpId)
  if (error) return { success: false, error: `Database error: ${error.message}` }

  if (fu) revalidatePath(`/events/${(fu as { event_id: string }).event_id}`)
  revalidatePath('/workflow')

  return { success: true, data: undefined }
}

// ─── Pin actions ──────────────────────────────────────────────────────────────

export async function pinEventAction(eventId: string): Promise<ActionResult<undefined>> {
  if (!eventId) return { success: false, error: 'Invalid event ID' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { error } = await supabase
    .from('event_pins')
    .upsert({ event_id: eventId }, { onConflict: 'event_id', ignoreDuplicates: true })

  if (error) return { success: false, error: `Database error: ${error.message}` }

  revalidatePath(`/events/${eventId}`)
  revalidatePath('/')

  return { success: true, data: undefined }
}

export async function unpinEventAction(eventId: string): Promise<ActionResult<undefined>> {
  if (!eventId) return { success: false, error: 'Invalid event ID' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { error } = await supabase
    .from('event_pins')
    .delete()
    .eq('event_id', eventId)

  if (error) return { success: false, error: `Database error: ${error.message}` }

  revalidatePath(`/events/${eventId}`)
  revalidatePath('/')

  return { success: true, data: undefined }
}

// ─── Checklist actions ────────────────────────────────────────────────────────

export async function createChecklistAction(
  values: ChecklistValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = ChecklistSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const projectId = await getActiveProjectId()
  const { data, error } = await supabase
    .from('launch_checklists')
    .insert({ name: parsed.data.name, description: parsed.data.description || null, project_id: projectId })
    .select('id')
    .single()

  if (error) return { success: false, error: `Database error: ${error.message}` }

  revalidatePath('/launch')
  return { success: true, data: { id: (data as { id: string }).id } }
}

export async function deleteChecklistAction(
  checklistId: string
): Promise<ActionResult<undefined>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { error } = await supabase.from('launch_checklists').delete().eq('id', checklistId)
  if (error) return { success: false, error: `Database error: ${error.message}` }
  revalidatePath('/launch')
  return { success: true, data: undefined }
}

export async function createChecklistItemAction(
  values: ChecklistItemValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = ChecklistItemSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const d = parsed.data
  const { data, error } = await supabase
    .from('launch_checklist_items')
    .insert({
      checklist_id: d.checklist_id,
      event_id:     d.event_id || null,
      title:        d.title,
      description:  d.description || null,
      owner:        d.owner || null,
      status:       d.status,
      due_date:     d.due_date ? new Date(d.due_date).toISOString() : null,
      sort_order:   d.sort_order,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: `Database error: ${error.message}` }

  revalidatePath('/launch')
  return { success: true, data: { id: (data as { id: string }).id } }
}

export async function updateChecklistItemStatusAction(
  itemId: string,
  status: ChecklistItemStatus
): Promise<ActionResult<undefined>> {
  const validStatuses: ChecklistItemStatus[] = ['backlog', 'in_progress', 'blocked', 'done']
  if (!validStatuses.includes(status)) return { success: false, error: 'Invalid status' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { error } = await supabase
    .from('launch_checklist_items')
    .update({ status })
    .eq('id', itemId)

  if (error) return { success: false, error: `Database error: ${error.message}` }

  revalidatePath('/launch')
  return { success: true, data: undefined }
}

// ─── Action board actions ─────────────────────────────────────────────────────

export async function createActionBoardAction(
  values: ActionBoardValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = ActionBoardSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const d = parsed.data
  const projectId = await getActiveProjectId()
  const { data, error } = await supabase
    .from('action_boards')
    .insert({
      name:         d.name,
      description:  d.description || null,
      filter_state: d.filter_state,
      layout_type:  d.layout_type,
      project_id:   projectId,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: `Database error: ${error.message}` }

  revalidatePath('/boards')
  return { success: true, data: { id: (data as { id: string }).id } }
}

export async function deleteActionBoardAction(
  boardId: string
): Promise<ActionResult<undefined>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { error } = await supabase.from('action_boards').delete().eq('id', boardId)
  if (error) return { success: false, error: `Database error: ${error.message}` }
  revalidatePath('/boards')
  return { success: true, data: undefined }
}
