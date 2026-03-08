import type { Metadata } from 'next'
import { Rocket } from 'lucide-react'
import { getAllChecklistsWithItems } from '@/lib/workflow/queries'
import { ChecklistManager } from '@/components/workflow/ChecklistManager'
import { getActiveProjectId } from '@/lib/project-context'

export const metadata: Metadata = { title: 'Launch Readiness' }
export const dynamic = 'force-dynamic'

export default async function LaunchPage() {
  const projectId = await getActiveProjectId()
  const data = await getAllChecklistsWithItems(projectId)

  // Compute aggregate progress
  const totalItems = data.reduce((s, c) => s + c.items.length, 0)
  const doneItems  = data.reduce((s, c) => s + c.items.filter((i) => i.status === 'done').length, 0)
  const pct = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100)

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Rocket size={16} className="text-muted-foreground" />
          <h1 className="text-base font-semibold text-foreground">Launch Readiness</h1>
        </div>

        {/* Overall progress */}
        {totalItems > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="tabular-nums">
              {doneItems}/{totalItems} done
              {pct === 100 && (
                <span className="ml-1.5 font-semibold text-emerald-400">Cleared!</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Checklist manager (client component for interactivity) */}
      <ChecklistManager initialData={data} />
    </div>
  )
}
