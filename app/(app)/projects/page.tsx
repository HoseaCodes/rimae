import type { Metadata } from 'next'
import { formatDistanceToNow } from 'date-fns'
import { FolderKanban, Activity, AlertTriangle } from 'lucide-react'
import { getPerProjectStats } from '@/lib/projects/queries'
import { getActiveProjectId } from '@/lib/project-context'
import { switchProjectAction, createProjectAction } from '@/lib/actions/projects'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Projects' }
export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const [stats, activeProjectId] = await Promise.all([
    getPerProjectStats(),
    getActiveProjectId(),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {stats.length} project{stats.length !== 1 ? 's' : ''} in this workspace
          </p>
        </div>
      </div>

      {/* Project grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map(({ project, eventCount, openCount, criticalHighCount }) => {
          const isActive = project.id === activeProjectId
          return (
            <div
              key={project.id}
              className={cn(
                'relative flex flex-col gap-3 rounded-lg border p-4 transition-colors',
                isActive
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-card hover:bg-muted/20'
              )}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FolderKanban size={15} className={cn(isActive ? 'text-primary' : 'text-muted-foreground/60')} />
                  <span className="text-sm font-semibold text-foreground">{project.name}</span>
                  {isActive && (
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground/50">/{project.slug}</span>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-xs text-muted-foreground">{project.description}</p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity size={11} />
                  {eventCount} event{eventCount !== 1 ? 's' : ''}
                </span>
                <span>{openCount} open</span>
                {criticalHighCount > 0 && (
                  <span className="flex items-center gap-1 text-orange-400">
                    <AlertTriangle size={11} />
                    {criticalHighCount} critical/high
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/40">
                  Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                </span>
                {!isActive && (
                  <form action={switchProjectAction.bind(null, project.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Switch
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* New project form */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">New Project</h2>
        <form
          className="space-y-3"
          action={async (formData: FormData) => {
            'use server'
            const name = formData.get('name') as string
            const slug = formData.get('slug') as string
            const description = formData.get('description') as string
            await createProjectAction({ name, slug, description })
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="proj-name">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                id="proj-name"
                name="name"
                required
                placeholder="My Project"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="proj-slug">
                Slug <span className="text-destructive">*</span>
              </label>
              <input
                id="proj-slug"
                name="slug"
                required
                placeholder="my-project"
                pattern="[a-z0-9-]+"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="proj-desc">
              Description
            </label>
            <input
              id="proj-desc"
              name="description"
              placeholder="Optional description"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Project
          </button>
        </form>
      </div>
    </div>
  )
}
