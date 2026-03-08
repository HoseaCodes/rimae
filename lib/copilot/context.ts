// ─── Knowledge Copilot — context assembly ────────────────────────────────────
// Converts retrieved DB records into a compact, LLM-readable context block.
// Enforces character limits so we never overflow the model's context window.

import type { RetrievedContext } from './retrieval'
import type { CopilotSource } from './types'

const MAX_CONTEXT_CHARS = 6_000
const MAX_SUMMARY_CHARS = 350  // per event

export interface AssembledContext {
  contextBlock: string
  sources: CopilotSource[]
  /** confidence hint derived from how much context was found */
  confidence: 'high' | 'medium' | 'low'
}

export function assembleContext(retrieved: RetrievedContext): AssembledContext {
  const lines: string[] = []
  const sources: CopilotSource[] = []
  let totalChars = 0

  // ── Events ────────────────────────────────────────────────────────────────
  if (retrieved.events.length > 0) {
    lines.push('## PROJECT EVENTS\n')
    for (const ev of retrieved.events) {
      if (totalChars >= MAX_CONTEXT_CHARS) break

      const date = formatDate(ev.event_timestamp)
      const tags = ev.tag_names?.length ? ` [tags: ${ev.tag_names.join(', ')}]` : ''
      const summary = ev.summary
        ? ev.summary.slice(0, MAX_SUMMARY_CHARS)
        : '(no summary)'

      const block = [
        `### ${ev.title}`,
        `Date: ${date} | Category: ${ev.category} | Severity: ${ev.severity} | Status: ${ev.status} | Type: ${ev.event_type}${tags}`,
        summary,
        '',
      ].join('\n')

      lines.push(block)
      totalChars += block.length

      sources.push({
        id: ev.id,
        type: 'event',
        title: ev.title,
        subtitle: `${ev.category} · ${ev.severity} · ${date}`,
        href: `/events/${ev.id}`,
      })
    }
  }

  // ── Follow-ups ────────────────────────────────────────────────────────────
  if (retrieved.followUps.length > 0 && totalChars < MAX_CONTEXT_CHARS) {
    lines.push('\n## OPEN FOLLOW-UPS\n')
    for (const fu of retrieved.followUps) {
      if (totalChars >= MAX_CONTEXT_CHARS) break

      const due = fu.due_date ? ` (due ${formatDate(fu.due_date)})` : ''
      const decision = fu.needs_decision ? ' [NEEDS DECISION]' : ''
      const block = `- ${fu.title}${decision} — status: ${fu.status} | priority: ${fu.priority}${due} — from event: "${fu.event_title}"\n`

      lines.push(block)
      totalChars += block.length

      sources.push({
        id: fu.id,
        type: 'follow_up',
        title: fu.title,
        subtitle: `${fu.status} · ${fu.priority}${fu.needs_decision ? ' · needs decision' : ''}`,
        href: `/events/${fu.event_id}`,
      })
    }
  }

  // ── Checklist items ───────────────────────────────────────────────────────
  if (retrieved.checklistItems.length > 0 && totalChars < MAX_CONTEXT_CHARS) {
    lines.push('\n## LAUNCH CHECKLIST STATUS\n')
    for (const item of retrieved.checklistItems) {
      if (totalChars >= MAX_CONTEXT_CHARS) break

      const due = item.due_date ? ` (due ${formatDate(item.due_date)})` : ''
      const owner = item.owner ? ` — owner: ${item.owner}` : ''
      const block = `- [${item.status}] ${item.title}${due}${owner}\n`

      lines.push(block)
      totalChars += block.length

      sources.push({
        id: item.id,
        type: 'checklist_item',
        title: item.title,
        subtitle: `Launch checklist · ${item.status}`,
        href: '/launch',
      })
    }
  }

  if (lines.length === 0) {
    return {
      contextBlock: '(No relevant project records found.)',
      sources: [],
      confidence: 'low',
    }
  }

  const totalSources = sources.length
  const confidence: AssembledContext['confidence'] =
    totalSources >= 5 ? 'high' : totalSources >= 2 ? 'medium' : 'low'

  return {
    contextBlock: lines.join('\n'),
    sources,
    confidence,
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().split('T')[0]
  } catch {
    return iso
  }
}
