'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2, Circle, Loader, AlertTriangle } from 'lucide-react'
import {
  createChecklistAction,
  createChecklistItemAction,
  updateChecklistItemStatusAction,
  deleteChecklistAction,
} from '@/lib/actions/workflow'
import { CHECKLIST_ITEM_STATUS_OPTIONS } from '@/lib/constants'
import type { LaunchChecklist, LaunchChecklistItem, ChecklistItemStatus } from '@/lib/database.types'

interface ChecklistWithItems extends LaunchChecklist {
  items: LaunchChecklistItem[]
}

interface ChecklistManagerProps {
  initialData: ChecklistWithItems[]
}

export function ChecklistManager({ initialData }: ChecklistManagerProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCreateChecklist(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createChecklistAction({ name: newName, description: newDesc || undefined })
      if (result.success) {
        setNewName('')
        setNewDesc('')
        setShowNewForm(false)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Checklists */}
      {initialData.map((cl) => (
        <ChecklistCard key={cl.id} checklist={cl} />
      ))}

      {initialData.length === 0 && !showNewForm && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No checklists yet. Create one to track launch readiness.</p>
        </div>
      )}

      {/* New checklist form */}
      {showNewForm ? (
        <form
          onSubmit={handleCreateChecklist}
          className="space-y-3 rounded-lg border border-border bg-card p-4"
        >
          <p className="text-xs font-semibold text-muted-foreground">New Checklist</p>
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Checklist name"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <textarea
            rows={2}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground resize-none focus:outline-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {pending ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus size={12} />
          New checklist
        </button>
      )}
    </div>
  )
}

// ─── Individual checklist card ────────────────────────────────────────────────

function ChecklistCard({ checklist }: { checklist: ChecklistWithItems }) {
  const [expanded, setExpanded] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemTitle, setItemTitle] = useState('')
  const [itemOwner, setItemOwner] = useState('')
  const [pending, startTransition] = useTransition()

  const total = checklist.items.length
  const done  = checklist.items.filter((i) => i.status === 'done').length
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100)

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await createChecklistItemAction({
        checklist_id: checklist.id,
        title:        itemTitle,
        owner:        itemOwner || undefined,
        status:       'backlog',
        sort_order:   total,
      })
      setItemTitle('')
      setItemOwner('')
      setShowAddItem(false)
    })
  }

  function handleDelete() {
    if (!confirm(`Delete checklist "${checklist.name}" and all its items?`)) return
    startTransition(async () => {
      await deleteChecklistAction(checklist.id)
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-shrink-0 text-muted-foreground"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{checklist.name}</p>
          {checklist.description && (
            <p className="text-xs text-muted-foreground">{checklist.description}</p>
          )}
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {done}/{total}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="flex-shrink-0 text-muted-foreground/40 hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Items */}
      {expanded && (
        <div>
          {checklist.items.length === 0 && !showAddItem && (
            <p className="px-4 py-3 text-xs text-muted-foreground italic">No items yet.</p>
          )}
          <div className="divide-y divide-border">
            {checklist.items.map((item) => (
              <ChecklistItemRow key={item.id} item={item} />
            ))}
          </div>

          {/* Add item */}
          {showAddItem ? (
            <form
              onSubmit={handleAddItem}
              className="flex items-center gap-2 border-t border-border px-4 py-2"
            >
              <input
                type="text"
                required
                autoFocus
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                placeholder="Item title"
                className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
              />
              <input
                type="text"
                value={itemOwner}
                onChange={(e) => setItemOwner(e.target.value)}
                placeholder="Owner (optional)"
                className="w-28 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddItem(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="border-t border-border px-4 py-2">
              <button
                type="button"
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus size={11} />
                Add item
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Checklist item row ───────────────────────────────────────────────────────

function ChecklistItemRow({ item }: { item: LaunchChecklistItem }) {
  const [pending, startTransition] = useTransition()

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateChecklistItemStatusAction(item.id, status as ChecklistItemStatus)
    })
  }

  const icon =
    item.status === 'done'       ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /> :
    item.status === 'blocked'    ? <AlertTriangle size={14} className="text-red-400 flex-shrink-0" /> :
    item.status === 'in_progress'? <Loader size={14} className="text-yellow-400 flex-shrink-0 animate-spin" /> :
                                   <Circle size={14} className="text-muted-foreground/40 flex-shrink-0" />

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-sm ${pending ? 'opacity-50' : ''}`}>
      {icon}
      <div className="min-w-0 flex-1">
        <span className={`text-sm ${item.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground/90'}`}>
          {item.title}
        </span>
        {item.owner && (
          <span className="ml-2 text-xs text-muted-foreground">@{item.owner}</span>
        )}
      </div>
      <select
        value={item.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={pending}
        className="flex-shrink-0 rounded border border-border bg-transparent px-1.5 py-0.5 text-[11px] text-foreground focus:outline-none"
      >
        {CHECKLIST_ITEM_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
