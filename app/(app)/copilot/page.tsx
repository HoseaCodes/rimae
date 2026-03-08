import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import { getSettings } from '@/lib/actions/settings'
import { getActiveProject } from '@/lib/project-context'
import { isAIEnabled, getActiveModelLabel } from '@/lib/ai'
import { CopilotClient } from '@/components/copilot/CopilotClient'

export const metadata: Metadata = { title: 'Knowledge Copilot' }
export const dynamic = 'force-dynamic'

export default async function CopilotPage() {
  const [settings, activeProject] = await Promise.all([
    getSettings(),
    getActiveProject(),
  ])

  const aiEnabled = isAIEnabled(settings)
  const modelLabel = aiEnabled ? getActiveModelLabel(settings) : null

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <Sparkles size={20} className="text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Knowledge Copilot</h1>
          {modelLabel && (
            <span className="ml-1 rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-mono">
              {modelLabel}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ask questions about your project history. Answers are grounded in your stored records.
          {activeProject && (
            <span className="ml-1 font-medium text-foreground">{activeProject.name}</span>
          )}
        </p>
      </div>

      {/* Main client UI */}
      <CopilotClient
        aiEnabled={aiEnabled}
        projectName={activeProject?.name}
      />
    </div>
  )
}
