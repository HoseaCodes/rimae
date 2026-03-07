'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { EventFormSchema } from '@/lib/schemas'
import { RIMAE_PROJECT_ID } from '@/lib/constants'
import type { ActionResult, EventFormValues } from '@/lib/schemas'
import type { SourceType } from '@/lib/database.types'
import { extractiveSummary } from '@/lib/ai'

// ─── Tag helpers ──────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function parseTagsRaw(tagsRaw: string | undefined): { name: string; slug: string }[] {
  if (!tagsRaw) return []
  return tagsRaw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((name) => ({ name, slug: slugify(name) }))
    .filter((t) => t.slug.length > 0)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyTags(eventId: string, tagsRaw: string | undefined, supabase: any) {
  const tagData = parseTagsRaw(tagsRaw)
  if (tagData.length === 0) return

  // Upsert tag records — create new ones, skip existing
  await supabase
    .from('tags')
    .upsert(tagData, { onConflict: 'slug', ignoreDuplicates: true })

  // Fetch IDs for all tags by slug
  const { data: tags } = await supabase
    .from('tags')
    .select('id')
    .in('slug', tagData.map((t) => t.slug))

  if (!tags?.length) return

  const tagIds = (tags as { id: string }[]).map((t) => t.id)

  // Upsert event_tags — skip duplicates
  await supabase
    .from('event_tags')
    .upsert(
      tagIds.map((tag_id) => ({ event_id: eventId, tag_id })),
      { onConflict: 'event_id,tag_id', ignoreDuplicates: true }
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createSource(values: EventFormValues, supabase: any): Promise<string | null> {
  if (!values.source_name) return null

  const { data } = await supabase
    .from('sources')
    .insert({
      project_id: RIMAE_PROJECT_ID,
      type: (values.source_type as SourceType) ?? 'manual',
      name: values.source_name,
      original_url: values.source_url || null,
      imported_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  return (data as { id: string } | null)?.id ?? null
}


// ─── Create event ─────────────────────────────────────────────────────────────

export async function createEventAction(
  values: EventFormValues
): Promise<ActionResult<{ eventId: string }>> {
  const parsed = EventFormSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const data = parsed.data

  // Create source if provided
  const sourceId = await createSource(data, supabase)

  // Insert event
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      project_id: RIMAE_PROJECT_ID,
      source_id: sourceId,
      title: data.title,
      summary: data.summary || extractiveSummary(data.raw_text) || null,
      raw_text: data.raw_text,
      event_type: data.event_type,
      category: data.category,
      severity: data.severity,
      status: data.status,
      event_timestamp: new Date(data.event_timestamp).toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: `Database error: ${error.message}` }
  }

  const eventId = (event as { id: string }).id

  // Process tags
  await applyTags(eventId, data.tags_raw, supabase)

  // Revalidate relevant paths
  revalidatePath('/')
  revalidatePath('/explorer')

  return { success: true, data: { eventId } }
}

// ─── Update event ─────────────────────────────────────────────────────────────

export async function updateEventAction(
  eventId: string,
  values: EventFormValues
): Promise<ActionResult<{ eventId: string }>> {
  const parsed = EventFormSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const data = parsed.data

  const { error } = await supabase
    .from('events')
    .update({
      title: data.title,
      summary: data.summary || null,
      raw_text: data.raw_text,
      event_type: data.event_type,
      category: data.category,
      severity: data.severity,
      status: data.status,
      event_timestamp: new Date(data.event_timestamp).toISOString(),
    })
    .eq('id', eventId)

  if (error) {
    return { success: false, error: `Database error: ${error.message}` }
  }

  // Replace all tags: delete existing, re-apply new
  await supabase.from('event_tags').delete().eq('event_id', eventId)
  await applyTags(eventId, data.tags_raw, supabase)

  revalidatePath('/')
  revalidatePath('/explorer')
  revalidatePath(`/events/${eventId}`)

  return { success: true, data: { eventId } }
}
