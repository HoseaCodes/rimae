import type { Metadata } from 'next'
import { LayoutGrid } from 'lucide-react'
import { getActionBoards } from '@/lib/workflow/queries'
import { ActionBoardList } from '@/components/workflow/ActionBoardForm'
import { getActiveProjectId } from '@/lib/project-context'

export const metadata: Metadata = { title: 'Action Boards' }
export const dynamic = 'force-dynamic'

export default async function BoardsPage() {
  const projectId = await getActiveProjectId()
  const boards = await getActionBoards(projectId)

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <LayoutGrid size={16} className="text-muted-foreground" />
        <h1 className="text-base font-semibold text-foreground">Action Boards</h1>
        <span className="text-xs text-muted-foreground">— saved operational views</span>
      </div>

      <p className="max-w-lg text-sm text-muted-foreground">
        Boards are named views with pre-configured filters. Create a board for any
        recurring focus area — launch blockers, auth workstream, decision backlog, etc.
        Opening a board takes you to the Explorer or Workflow page with filters applied.
      </p>

      <ActionBoardList boards={boards} />
    </div>
  )
}
