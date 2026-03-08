'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import type { SavedView, Project } from '@/lib/database.types'

interface AppShellProps {
  children: React.ReactNode
  savedViews: Pick<SavedView, 'id' | 'name'>[]
  projects: Project[]
  activeProject: Project | null
}

export function AppShell({ children, savedViews, projects, activeProject }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar savedViews={savedViews} projects={projects} activeProject={activeProject} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
