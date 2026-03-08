import type { Metadata } from 'next'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Layers, AlertTriangle, AlertCircle, Clock, CheckSquare } from 'lucide-react'
import { getWorkflowQueues } from '@/lib/workflow/queries'
import {
  FOLLOW_UP_STATUS_STYLES,
  FOLLOW_UP_STATUS_LABELS,
  FOLLOW_UP_PRIORITY_STYLES,
  FOLLOW_UP_PRIORITY_LABELS,
} from '@/lib/constants'
import type { FollowUpWithEvent } from '@/lib/database.types'

export const metadata: Metadata = { title: 'Workflow' }
export const dynamic = 'force-dynamic'

type Queue = 'open' | 'blocked' | 'due_soon' | 'needs_decision' | 'overdue'

interface PageProps {
  searchParams: Promise<{ queue?: string }>
}

const TABS: { id: Queue; label: string; icon: React.ReactNode }[] = [
  { id: 'open',           label: 'All Open',       icon: <CheckSquare size={13} /> },
  { id: 'blocked',        label: 'Blocked',         icon: <AlertTriangle size={13} /> },
  { id: 'due_soon',       label: 'Due Soon',        icon: <Clock size={13} /> },
  { id: 'needs_decision', label: 'Needs Decision',  icon: <AlertCircle size={13} /> },
  { id: 'overdue',        label: 'Overdue',         icon: <AlertTriangle size={13} /> },
]

export default async function WorkflowPage({ searchParams }: PageProps) {
  const { queue: qParam } = await searchParams
  const activeQueue: Queue = (TABS.find((t) => t.id === qParam)?.id) ?? 'open'

  const { open, blocked, needsDecision, dueSoon, overdue } = await getWorkflowQueues()

  const counts: Record<Queue, number> = {
    open:           open.length,
    blocked:        blocked.length,
    due_soon:       dueSoon.length,
    needs_decision: needsDecision.length,
    overdue:        overdue.length,
  }

  const rows: Record<Queue, FollowUpWithEvent[]> = {
    open,
    blocked,
    due_soon:       dueSoon,
    needs_decision: needsDecision,
    overdue,
  }

  const activeRows = rows[activeQueue]

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-muted-foreground" />
        <h1 className="text-base font-semibold text-foreground">Workflow</h1>
        <span className="text-xs text-muted-foreground">— review queues &amp; follow-ups</span>
      </div>

      {/* Queue tabs */}
      <div className="flex gap-0.5 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1">
        {TABS.map((tab) => {
          const isActive = tab.id === activeQueue
          return (
            <Link
              key={tab.id}
              href={`/workflow?queue=${tab.id}`}
              className={[
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab.icon}
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={[
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  tab.id === 'blocked' || tab.id === 'overdue'
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-zinc-500/15 text-zinc-400',
                ].join(' ')}>
                  {counts[tab.id]}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      {activeRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {activeQueue === 'open'     && 'No open follow-ups. Use the event detail page to create one.'}
            {activeQueue === 'blocked'  && 'Nothing blocked — clear!'}
            {activeQueue === 'due_soon' && 'Nothing due in the next 7 days.'}
            {activeQueue === 'needs_decision' && 'No unresolved decision items.'}
            {activeQueue === 'overdue'  && 'Nothing overdue — all caught up!'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Follow-up</th>
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Event</th>
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Priority</th>
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Assignee</th>
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeRows.map((fu) => {
                const isOverdue = fu.due_date && fu.status !== 'done' && new Date(fu.due_date) < new Date()
                return (
                  <tr key={fu.id} className="hover:bg-muted/20">
                    <td className="max-w-[260px] px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-foreground/90">{fu.title}</span>
                        {fu.needs_decision && (
                          <AlertCircle size={11} className="flex-shrink-0 text-purple-400" title="Needs decision" />
                        )}
                      </div>
                      {fu.description && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{fu.description}</p>
                      )}
                    </td>
                    <td className="max-w-[200px] px-3 py-2.5">
                      <Link
                        href={`/events/${fu.event_id}`}
                        className="truncate text-xs text-muted-foreground hover:text-primary"
                      >
                        {fu.event_title}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${FOLLOW_UP_PRIORITY_STYLES[fu.priority]}`}>
                        {FOLLOW_UP_PRIORITY_LABELS[fu.priority]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${FOLLOW_UP_STATUS_STYLES[fu.status]}`}>
                        {FOLLOW_UP_STATUS_LABELS[fu.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {fu.assignee ? `@${fu.assignee}` : '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {fu.due_date
                        ? format(parseISO(fu.due_date), 'MMM d')
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
