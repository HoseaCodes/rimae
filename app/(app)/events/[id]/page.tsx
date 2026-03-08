import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Calendar,
  Tag,
  ListTodo,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import {
  EVENT_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
} from '@/lib/constants'
import { getSettings } from '@/lib/actions/settings'
import { eventQualityScore, isAIEnabled, getActiveModelLabel } from '@/lib/ai'
import { IntelligencePanel } from '@/components/intelligence/IntelligencePanel'
import { PinButton } from '@/components/workflow/PinButton'
import { FollowUpForm } from '@/components/workflow/FollowUpForm'
import { FollowUpList } from '@/components/workflow/FollowUpList'
import { isEventPinned, getFollowUpsForEvent } from '@/lib/workflow/queries'
import { getActiveProject } from '@/lib/project-context'
import { getSimilarityLabel, getSimilarityColor } from '@/lib/semantic/build-embedding-input'
import type { EventWithMeta, EventSeverity, EventStatus, EventCategory } from '@/lib/database.types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('events_with_meta')
    .select('title')
    .eq('id', id)
    .single()
  const eventMeta = data as { title: string } | null
  return { title: eventMeta?.title ?? 'Event' }
}

export const dynamic = 'force-dynamic'

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events_with_meta')
    .select('*')
    .eq('id', id)
    .single()

  if (!event || error) {
    notFound()
  }

  const e = event as EventWithMeta

  // Workflow data — run in parallel with AI/related queries
  const [settings, isPinned, followUps, activeProject] = await Promise.all([
    getSettings(),
    isEventPinned(e.id),
    getFollowUpsForEvent(e.id),
    getActiveProject(),
  ])
  const aiEnabled = isAIEnabled(settings)
  const qualityScore = eventQualityScore({
    title: e.title,
    summary: e.summary,
    raw_text: e.raw_text,
    tag_names: e.tag_names,
    source_name: e.source_name,
  })
  const modelLabel = getActiveModelLabel(settings)

  // Related events via pgvector similarity (only if this event has an embedding)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any
  const { data: relatedRaw } = await supabaseAny.rpc('find_related_events', {
    p_event_id: e.id,
    p_project_id: e.project_id,
    p_limit: 5,
  })
  const relatedIds = ((relatedRaw ?? []) as { id: string; similarity: number }[])
  const scoreMap = Object.fromEntries(relatedIds.map((r) => [r.id, r.similarity]))
  const relatedEvents: { id: string; title: string; category: EventCategory; severity: EventSeverity; status: EventStatus; similarity: number }[] = relatedIds.length
    ? ((await supabaseAny
        .from('events_with_meta')
        .select('id, title, category, severity, status')
        .in('id', relatedIds.map((r) => r.id))
      ).data ?? []).map((ev: { id: string; title: string; category: EventCategory; severity: EventSeverity; status: EventStatus }) => ({
        ...ev,
        similarity: scoreMap[ev.id] ?? 0,
      }))
    : []

  return (
    <div data-testid="event-detail-page" className="mx-auto max-w-4xl space-y-6 px-6 py-6">
      {/* Back navigation */}
      <Link
        href="/explorer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to Explorer
      </Link>

      {/* Title + status row */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 data-testid="event-title" className="text-xl font-semibold leading-snug tracking-tight text-foreground">
            {e.title}
          </h1>
          <div className="flex flex-shrink-0 items-center gap-2">
            <PinButton eventId={e.id} isPinned={isPinned} />
            <Link
              href={`/events/${e.id}/edit`}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-card/80 hover:text-foreground"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Badge row */}
        <div data-testid="event-badges" className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={e.severity} />
          <StatusBadge status={e.status} />
          <CategoryBadge category={e.category} />
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {EVENT_TYPE_LABELS[e.event_type]}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {format(new Date(e.event_timestamp), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Updated {format(new Date(e.updated_at), 'MMM d, yyyy')}
          </span>
          {e.source_name && (
            <span className="flex items-center gap-1">
              <ExternalLink size={12} />
              {e.source_name}
              {e.source_type && (
                <span className="opacity-60">
                  ({SOURCE_TYPE_LABELS[e.source_type]})
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {e.summary && (
        <section data-testid="event-summary-section" className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Summary
          </h2>
          <p className="text-sm leading-relaxed text-foreground/90">{e.summary}</p>
        </section>
      )}

      {/* Raw content */}
      <section data-testid="event-raw-content" className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Raw Content
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground/85 whitespace-pre-wrap break-words">
            {e.raw_text}
          </pre>
        </div>
      </section>

      {/* Tags */}
      {e.tag_names.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Tag size={11} />
            Tags
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {e.tag_names.map((tag) => (
              <Link
                key={tag}
                href={`/explorer?tag=${encodeURIComponent(tag)}`}
                className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Metadata table */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Metadata
        </h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-border">
              <MetaRow label="Event ID" value={e.id} mono />
              <MetaRow label="Project" value={activeProject?.name ?? 'RIMAE'} />
              <MetaRow
                label="Event Time"
                value={format(new Date(e.event_timestamp), 'PPpp')}
              />
              <MetaRow
                label="Created"
                value={format(new Date(e.created_at), 'PPpp')}
              />
              <MetaRow
                label="Updated"
                value={format(new Date(e.updated_at), 'PPpp')}
              />
              {e.source_name && (
                <MetaRow label="Source" value={e.source_name} />
              )}
              {e.source_type && (
                <MetaRow
                  label="Source Type"
                  value={SOURCE_TYPE_LABELS[e.source_type]}
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Follow-ups */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <ListTodo size={11} />
          Follow-ups
          {followUps.length > 0 && (
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {followUps.length}
            </span>
          )}
        </h2>
        <div className="space-y-2">
          <FollowUpList followUps={followUps} />
          <FollowUpForm eventId={e.id} />
        </div>
      </section>

      {/* Intelligence panel */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Intelligence
        </h2>
        <IntelligencePanel
          eventId={e.id}
          currentCategory={e.category}
          aiEnabled={aiEnabled}
          qualityScore={qualityScore}
          modelLabel={modelLabel}
        />
      </section>

      {/* Related events */}
      {relatedEvents.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Related Events
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {relatedEvents.map((rel) => {
              const simLabel = getSimilarityLabel(rel.similarity)
              return (
                <Link
                  key={rel.id}
                  href={`/events/${rel.id}`}
                  className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-foreground/85">{rel.title}</span>
                    <span className={`text-[10px] font-medium ${getSimilarityColor(simLabel)}`}>
                      {simLabel}
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <SeverityBadge severity={rel.severity} />
                    <StatusBadge status={rel.status} />
                    <CategoryBadge category={rel.category} />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function MetaRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <tr>
      <td className="w-32 bg-muted/30 px-3 py-2 font-medium text-muted-foreground">
        {label}
      </td>
      <td className={`px-3 py-2 text-foreground/80 ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </td>
    </tr>
  )
}
