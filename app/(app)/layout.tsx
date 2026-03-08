import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { getActiveProjectId, getActiveProject } from '@/lib/project-context'
import { getProjects } from '@/lib/projects/queries'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const projectId = await getActiveProjectId()

  // Load all data needed for the shell in parallel
  const [activeProject, projects, savedViewsResult] = await Promise.all([
    getActiveProject(),
    getProjects(),
    supabase
      .from('saved_views')
      .select('id, name')
      .eq('project_id', projectId)
      .order('created_at'),
  ])

  return (
    <AppShell
      savedViews={savedViewsResult.data ?? []}
      projects={projects}
      activeProject={activeProject}
    >
      {children}
    </AppShell>
  )
}
