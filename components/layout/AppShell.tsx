'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import type { SavedView } from '@/lib/database.types'

interface AppShellProps {
  children: React.ReactNode
  savedViews: Pick<SavedView, 'id' | 'name'>[]
}

export function AppShell({ children, savedViews }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar savedViews={savedViews} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
