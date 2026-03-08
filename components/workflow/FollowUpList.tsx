'use client'

import { useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { Trash2, AlertCircle } from 'lucide-react'
import { updateFollowUpStatusAction, deleteFollowUpAction } from '@/lib/actions/workflow'
import {
  FOLLOW_UP_STATUS_OPTIONS,
  FOLLOW_UP_STATUS_STYLES,
  FOLLOW_UP_PRIORITY_STYLES,
  FOLLOW_UP_PRIORITY_LABELS,
} from '@/lib/constants'
import type { FollowUp } from '@/lib/database.types'

interface FollowUpListProps {
  followUps: FollowUp[]
}

export function FollowUpList({ followUps }: FollowUpListProps) {
  if (followUps.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No follow-ups yet.</p>
    )
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
      {followUps.map((fu) => (
        <FollowUpRow key={fu.id} followUp={fu} />
      ))}
    </div>
  )
}

function FollowUpRow({ followUp: fu }: { followUp: FollowUp }) {
  const [pending, startTransition] = useTransition()

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateFollowUpStatusAction(fu.id, status as FollowUp['status'])
    })
  }

  function handleDelete() {
    if (!confirm('Delete this follow-up?')) return
    startTransition(async () => {
      await deleteFollowUpAction(fu.id)
    })
  }

  const isOverdue =
    fu.due_date &&
    fu.status !== 'done' &&
    new Date(fu.due_date) < new Date()

  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 text-sm ${pending ? 'opacity-50' : ''}`}>
      {/* Priority dot */}
      <span
        className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full border ${FOLLOW_UP_PRIORITY_STYLES[fu.priority]}`}
        title={FOLLOW_UP_PRIORITY_LABELS[fu.priority]}
      />

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-foreground/90">{fu.title}</span>
          {fu.needs_decision && (
            <span className="flex items-center gap-0.5 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
              <AlertCircle size={10} />
              Decision
            </span>
          )}
        </div>
        {fu.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{fu.description}</p>
        )}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {fu.assignee && <span>@{fu.assignee}</span>}
          {fu.due_date && (
            <span className={isOverdue ? 'text-red-400' : ''}>
              {isOverdue ? 'Overdue · ' : ''}
              {format(parseISO(fu.due_date), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>

      {/* Status select */}
      <select
        value={fu.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={pending}
        className={`flex-shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-medium focus:outline-none ${FOLLOW_UP_STATUS_STYLES[fu.status]}`}
        style={{ background: 'transparent' }}
      >
        {FOLLOW_UP_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} style={{ background: 'hsl(var(--card))' }}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="flex-shrink-0 text-muted-foreground/40 hover:text-red-400 transition-colors disabled:opacity-30"
        title="Delete follow-up"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
