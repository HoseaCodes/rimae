'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { createFollowUpAction } from '@/lib/actions/workflow'
import { FOLLOW_UP_STATUS_OPTIONS, FOLLOW_UP_PRIORITY_OPTIONS } from '@/lib/constants'
import type { FollowUpValues } from '@/lib/schemas'

interface FollowUpFormProps {
  eventId: string
}

const DEFAULT: Omit<FollowUpValues, 'event_id'> = {
  title:          '',
  description:    '',
  assignee:       '',
  priority:       'medium',
  status:         'backlog',
  due_date:       '',
  needs_decision: false,
}

export function FollowUpForm({ eventId }: FollowUpFormProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(DEFAULT)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function set<K extends keyof typeof DEFAULT>(key: K, value: (typeof DEFAULT)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createFollowUpAction({ event_id: eventId, ...form })
      if (result.success) {
        setForm(DEFAULT)
        setOpen(false)
      } else {
        setError(result.error)
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
      >
        <Plus size={12} />
        Add follow-up
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border bg-card/60 p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">New Follow-up</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-muted-foreground">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="What needs to be done?"
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-muted-foreground">Description</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Row: priority + status + assignee */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => set('priority', e.target.value as FollowUpValues['priority'])}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none"
          >
            {FOLLOW_UP_PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">Status</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as FollowUpValues['status'])}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none"
          >
            {FOLLOW_UP_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">Assignee</label>
          <input
            type="text"
            value={form.assignee}
            onChange={(e) => set('assignee', e.target.value)}
            placeholder="name / handle"
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Row: due date + needs decision */}
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">Due date</label>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => set('due_date', e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 pt-4 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.needs_decision}
            onChange={(e) => set('needs_decision', e.target.checked)}
            className="rounded"
          />
          Needs decision
        </label>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save Follow-up'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setForm(DEFAULT) }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
