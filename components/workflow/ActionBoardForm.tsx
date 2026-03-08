'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { createActionBoardAction, deleteActionBoardAction } from '@/lib/actions/workflow'
import type { ActionBoard } from '@/lib/database.types'

interface ActionBoardFormProps {
  boards: ActionBoard[]
}

export function ActionBoardList({ boards }: ActionBoardFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName]     = useState('')
  const [desc, setDesc]     = useState('')
  const [error, setError]   = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createActionBoardAction({
        name,
        description:  desc || undefined,
        filter_state: {},
        layout_type:  'list',
      })
      if (result.success) {
        setName('')
        setDesc('')
        setShowForm(false)
      } else {
        setError(result.error)
      }
    })
  }

  function handleDelete(boardId: string, boardName: string) {
    if (!confirm(`Delete board "${boardName}"?`)) return
    startTransition(async () => {
      await deleteActionBoardAction(boardId)
    })
  }

  return (
    <div className="space-y-4">
      {boards.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No boards yet. Create a board to save a named operational view.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => (
          <div
            key={board.id}
            className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-border/80"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{board.name}</p>
                {board.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {board.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(board.id, board.name)}
                disabled={pending}
                className="flex-shrink-0 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-auto pt-2">
              <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground capitalize">
                {board.layout_type}
              </span>
              <a
                href={buildBoardHref(board)}
                className="ml-auto text-[11px] font-medium text-primary hover:underline"
              >
                Open board →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">New Board</span>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Board name (e.g. Launch blockers)"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <textarea
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
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
              {pending ? 'Creating…' : 'Create Board'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus size={12} />
          New board
        </button>
      )}
    </div>
  )
}

// Build a URL to open a board in the workflow page (or explorer, based on filter_state)
function buildBoardHref(board: ActionBoard): string {
  const fs = board.filter_state as Record<string, unknown>
  // If the filter_state has explorer-compatible keys, go to /explorer
  const explorerKeys = ['q', 'category', 'severity', 'status', 'source_type', 'tag', 'date_from', 'date_to']
  const isExplorerBoard = Object.keys(fs).some((k) => explorerKeys.includes(k))

  if (isExplorerBoard) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(fs)) {
      if (v !== undefined && v !== null && v !== '') {
        params.set(k, String(v))
      }
    }
    return `/explorer?${params.toString()}`
  }

  // Default: open workflow page with filter
  return `/workflow`
}
