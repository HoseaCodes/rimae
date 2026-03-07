'use client'

import { useState, useTransition } from 'react'
import { Bookmark, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createSavedViewAction } from '@/lib/actions/views'
import type { FilterState } from '@/lib/database.types'

interface SaveViewButtonProps {
  filterState: FilterState
}

export function SaveViewButton({ filterState }: SaveViewButtonProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const hasFilters = Object.values(filterState).some((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  )

  const handleSave = () => {
    setError('')
    startTransition(async () => {
      const result = await createSavedViewAction({
        name,
        description: description || undefined,
        filter_state: filterState as Record<string, unknown>,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      setSaved(true)
      setTimeout(() => {
        setOpen(false)
        setName('')
        setDescription('')
        setSaved(false)
      }, 1000)
    })
  }

  const handleOpen = () => {
    setName('')
    setDescription('')
    setError('')
    setSaved(false)
    setOpen(true)
  }

  if (!hasFilters) return null

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-primary/40 hover:bg-card/80 hover:text-foreground"
      >
        <Bookmark size={12} />
        Save View
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Save Current View</DialogTitle>
          </DialogHeader>

          {saved ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
                <Check size={18} className="text-emerald-400" />
              </div>
              <p className="text-sm text-muted-foreground">View saved successfully</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Open Auth Issues"
                  className="text-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Description (optional)
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this view shows"
                  className="resize-none text-sm"
                  rows={2}
                />
              </div>

              <p className="text-xs text-muted-foreground/60">
                Saves the current search and filter combination.
              </p>
            </div>
          )}

          {!saved && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending || !name.trim()}
              >
                {isPending ? 'Saving...' : 'Save View'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
