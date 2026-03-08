'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronDown, Check, FolderOpen, Loader2, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/database.types'
import { switchProjectAction } from '@/lib/actions/projects'

interface ProjectSwitcherProps {
  projects: Project[]
  activeProject: Project | null
}

export function ProjectSwitcher({ projects, activeProject }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSwitch(projectId: string) {
    if (projectId === activeProject?.id) {
      setOpen(false)
      return
    }
    setOpen(false)
    startTransition(async () => {
      await switchProjectAction(projectId)
    })
  }

  return (
    <div className="relative px-2 pb-1">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
          'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
          open && 'bg-sidebar-accent/60 text-sidebar-foreground'
        )}
      >
        {pending ? (
          <Loader2 size={13} className="shrink-0 animate-spin text-primary/70" />
        ) : (
          <FolderOpen size={13} className="shrink-0 text-primary/70" />
        )}
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {pending ? 'Switching…' : (activeProject?.name ?? 'Select Project')}
        </span>
        <ChevronDown
          size={11}
          className={cn('shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
            <div className="py-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSwitch(project.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/60"
                >
                  <Check
                    size={11}
                    className={cn(
                      'shrink-0',
                      project.id === activeProject?.id ? 'text-primary' : 'opacity-0'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{project.name}</p>
                    {project.description && (
                      <p className="truncate text-[10px] text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}

              {projects.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No projects found</p>
              )}

              {/* Footer actions */}
              <div className="border-t border-border mt-1 pt-1">
                <Link
                  href="/projects"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <PlusCircle size={11} className="shrink-0" />
                  Manage projects
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
