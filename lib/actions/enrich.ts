'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/actions/settings'
import { isAIEnabled } from '@/lib/ai'
import { callProvider, generateEmbeddingVector } from '@/lib/providers'
import { buildEmbeddingInput } from '@/lib/semantic/build-embedding-input'
import { CATEGORY_OPTIONS } from '@/lib/constants'
import type { ActionResult } from '@/lib/schemas'
import type { EventCategory, EventWithMeta } from '@/lib/database.types'

// ─── Shared event loader ──────────────────────────────────────────────────────

async function loadEventForEnrich(eventId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('events')
    .select('id, title, raw_text, category')
    .eq('id', eventId)
    .single()
  if (error || !data) throw new Error('Event not found')
  return data as { id: string; title: string; raw_text: string; category: EventCategory }
}

// ─── Regenerate Summary ───────────────────────────────────────────────────────

export async function regenerateSummaryAction(
  eventId: string
): Promise<ActionResult<{ summary: string }>> {
  const settings = await getSettings()
  if (!isAIEnabled(settings)) {
    return { success: false, error: 'AI is disabled. Enable it in Settings first.' }
  }

  let event: Awaited<ReturnType<typeof loadEventForEnrich>>
  try {
    event = await loadEventForEnrich(eventId)
  } catch {
    return { success: false, error: 'Event not found.' }
  }

  const prompt = [
    'Summarize the following project event in 2-3 concise sentences.',
    'Focus on the core decision, issue, or insight. Be specific.',
    'Output only the summary text — no preamble, no labels, no quotes.\n',
    `EVENT TITLE: ${event.title}`,
    `EVENT CATEGORY: ${event.category}\n`,
    'CONTENT:',
    event.raw_text.slice(0, 8000),
  ].join('\n')

  let summary: string
  try {
    summary = await callProvider(prompt, settings, 512)
  } catch (err) {
    return { success: false, error: `Provider error: ${String(err)}` }
  }

  if (!summary) return { success: false, error: 'Provider returned an empty response.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { error: dbError } = await supabase
    .from('events')
    .update({ summary, summary_auto: true })
    .eq('id', eventId)

  if (dbError) return { success: false, error: `Database error: ${dbError.message}` }

  revalidatePath(`/events/${eventId}`)
  return { success: true, data: { summary } }
}

// ─── Suggest Tags ─────────────────────────────────────────────────────────────

export async function suggestTagsAction(
  eventId: string
): Promise<ActionResult<{ tags: string[] }>> {
  const settings = await getSettings()
  if (!isAIEnabled(settings)) {
    return { success: false, error: 'AI is disabled. Enable it in Settings first.' }
  }

  let event: Awaited<ReturnType<typeof loadEventForEnrich>>
  try {
    event = await loadEventForEnrich(eventId)
  } catch {
    return { success: false, error: 'Event not found.' }
  }

  const prompt = [
    'Extract 3 to 7 relevant tags for this project event.',
    'Tags must be lowercase, 1-3 words, hyphenated if multi-word (e.g. "auth-flow", "api-bug").',
    'Return only a comma-separated list of tags, nothing else.\n',
    `EVENT TITLE: ${event.title}`,
    `CATEGORY: ${event.category}\n`,
    'CONTENT:',
    event.raw_text.slice(0, 4000),
  ].join('\n')

  let raw: string
  try {
    raw = await callProvider(prompt, settings, 128)
  } catch (err) {
    return { success: false, error: `Provider error: ${String(err)}` }
  }

  const tags = raw
    .split(',')
    .map((t) =>
      t.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    )
    .filter((t) => t.length > 0 && t.length <= 60)
    .slice(0, 10)

  if (!tags.length) return { success: false, error: 'Provider returned no valid tags.' }

  return { success: true, data: { tags } }
}

// ─── Apply tag suggestions ────────────────────────────────────────────────────

export async function applyTagSuggestionsAction(
  eventId: string,
  tags: string[]
): Promise<ActionResult<undefined>> {
  if (!tags.length) return { success: true, data: undefined }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const tagData = tags.map((name) => ({
    name,
    slug: name.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
  }))

  await supabase.from('tags').upsert(tagData, { onConflict: 'slug', ignoreDuplicates: true })

  const { data: tagRows } = await supabase
    .from('tags')
    .select('id')
    .in('slug', tagData.map((t) => t.slug))

  if (!tagRows?.length) return { success: false, error: 'Failed to resolve tag IDs.' }

  await supabase
    .from('event_tags')
    .upsert(
      (tagRows as { id: string }[]).map((t) => ({ event_id: eventId, tag_id: t.id })),
      { onConflict: 'event_id,tag_id', ignoreDuplicates: true }
    )

  revalidatePath(`/events/${eventId}`)
  return { success: true, data: undefined }
}

// ─── Suggest Category ─────────────────────────────────────────────────────────

export async function suggestCategoryAction(
  eventId: string
): Promise<ActionResult<{ category: EventCategory }>> {
  const settings = await getSettings()
  if (!isAIEnabled(settings)) {
    return { success: false, error: 'AI is disabled. Enable it in Settings first.' }
  }

  let event: Awaited<ReturnType<typeof loadEventForEnrich>>
  try {
    event = await loadEventForEnrich(eventId)
  } catch {
    return { success: false, error: 'Event not found.' }
  }

  const validCategories = CATEGORY_OPTIONS.map((c) => c.value).join(', ')

  const prompt = [
    `Classify this project event into exactly one of these categories: ${validCategories}`,
    'Return only the category value (e.g. "bug"), nothing else.\n',
    `EVENT TITLE: ${event.title}\n`,
    'CONTENT:',
    event.raw_text.slice(0, 2000),
  ].join('\n')

  let raw: string
  try {
    raw = await callProvider(prompt, settings, 32)
  } catch (err) {
    return { success: false, error: `Provider error: ${String(err)}` }
  }

  const category = raw.trim().toLowerCase() as EventCategory
  const valid = CATEGORY_OPTIONS.map((c) => c.value) as string[]
  if (!valid.includes(category)) {
    return { success: false, error: `Provider returned an unrecognised category: "${raw.trim()}"` }
  }

  return { success: true, data: { category } }
}

// ─── Apply category ───────────────────────────────────────────────────────────

export async function applyCategoryAction(
  eventId: string,
  category: EventCategory
): Promise<ActionResult<undefined>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { error } = await supabase
    .from('events')
    .update({ category })
    .eq('id', eventId)

  if (error) return { success: false, error: `Database error: ${error.message}` }

  revalidatePath(`/events/${eventId}`)
  return { success: true, data: undefined }
}

// ─── Generate embedding for one event ────────────────────────────────────────

export async function generateEventEmbeddingAction(
  eventId: string
): Promise<ActionResult<undefined>> {
  const settings = await getSettings()
  if (!isAIEnabled(settings)) {
    return { success: false, error: 'AI is disabled. Enable it in Settings first.' }
  }
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OPENAI_API_KEY is required for embedding generation.' }
  }

  let event: Awaited<ReturnType<typeof loadEventForEnrich>>
  try {
    event = await loadEventForEnrich(eventId)
  } catch {
    return { success: false, error: 'Event not found.' }
  }

  const input = buildEmbeddingInput({ title: event.title, raw_text: event.raw_text })

  let embedding: number[]
  try {
    embedding = await generateEmbeddingVector(input, settings)
  } catch (err) {
    return { success: false, error: `Embedding error: ${String(err)}` }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { error: dbError } = await supabase
    .from('events')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', eventId)

  if (dbError) return { success: false, error: `Database error: ${dbError.message}` }

  revalidatePath(`/events/${eventId}`)
  return { success: true, data: undefined }
}

// ─── Generate Context Pack ────────────────────────────────────────────────────
// Assembles a structured markdown document from an event + its related events.
// No AI required — pure data assembly for pasting into LLM conversations.

export async function generateContextPackAction(
  eventId: string
): Promise<ActionResult<{ markdown: string }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { data: raw, error } = await supabase
    .from('events_with_meta')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error || !raw) return { success: false, error: 'Event not found.' }
  const e = raw as EventWithMeta

  // Related events via pgvector (empty if no embedding)
  const { data: relatedRaw } = await supabase.rpc('find_related_events', {
    p_event_id: e.id,
    p_project_id: e.project_id,
    p_limit: 5,
  })
  const relatedIds = ((relatedRaw ?? []) as { id: string; similarity: number }[])
  const relatedEvents: { id: string; title: string; category: string; severity: string; status: string }[] =
    relatedIds.length
      ? ((await supabase
          .from('events_with_meta')
          .select('id, title, category, severity, status')
          .in('id', relatedIds.map((r) => r.id))
        ).data ?? [])
      : []

  const lines: string[] = [
    `# ${e.title}`,
    '',
    `**ID**: \`${e.id}\``,
    `**Category**: ${e.category} | **Severity**: ${e.severity} | **Status**: ${e.status}`,
    `**Type**: ${e.event_type}`,
    `**Event Time**: ${new Date(e.event_timestamp).toLocaleString()}`,
    `**Updated**: ${new Date(e.updated_at).toLocaleString()}`,
  ]

  if (e.source_name) {
    lines.push(`**Source**: ${e.source_name}${e.source_type ? ` (${e.source_type})` : ''}`)
  }

  if (e.tag_names?.length) {
    lines.push('', `**Tags**: ${e.tag_names.map((t: string) => `\`${t}\``).join(', ')}`)
  }

  if (e.summary) {
    lines.push('', '## Summary', '', e.summary)
  }

  if (relatedEvents.length) {
    lines.push('', '## Related Events', '')
    for (const rel of relatedEvents) {
      lines.push(`- **${rel.title}** — ${rel.category} / ${rel.severity} / ${rel.status}`)
    }
  }

  lines.push('', '## Raw Content', '', '```', e.raw_text.slice(0, 12000), '```')

  return { success: true, data: { markdown: lines.join('\n') } }
}

// ─── Backfill embeddings (up to 20 at a time) ────────────────────────────────

export async function backfillEmbeddingsAction(): Promise<ActionResult<{ processed: number }>> {
  const settings = await getSettings()
  if (!isAIEnabled(settings)) {
    return { success: false, error: 'AI is disabled. Enable it in Settings first.' }
  }
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OPENAI_API_KEY is required for embedding generation.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data: events, error } = await supabase
    .from('events_missing_embeddings')
    .select('id, title')
    .limit(20)

  if (error) return { success: false, error: `Database error: ${error.message}` }
  if (!events?.length) return { success: true, data: { processed: 0 } }

  let processed = 0
  for (const ev of events as { id: string; title: string }[]) {
    const result = await generateEventEmbeddingAction(ev.id)
    if (result.success) processed++
  }

  return { success: true, data: { processed } }
}
