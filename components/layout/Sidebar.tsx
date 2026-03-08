'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  Bookmark,
  ChevronRight,
  Activity,
  BarChart2,
  Settings,
  Layers,
  Rocket,
  LayoutGrid,
  FolderKanban,
  Globe2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SavedView, Project } from '@/lib/database.types'
import { ProjectSwitcher } from '@/components/layout/ProjectSwitcher'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/',             icon: <LayoutDashboard size={15} /> },
  { label: 'Explorer',     href: '/explorer',     icon: <Search size={15} /> },
  { label: 'Ingest',       href: '/ingest',       icon: <PlusCircle size={15} /> },
  { label: 'Workflow',     href: '/workflow',     icon: <Layers size={15} /> },
  { label: 'Launch',       href: '/launch',       icon: <Rocket size={15} /> },
  { label: 'Boards',       href: '/boards',       icon: <LayoutGrid size={15} /> },
  { label: 'Saved Views',  href: '/views',        icon: <Bookmark size={15} /> },
  { label: 'Observability',href: '/observability',icon: <BarChart2 size={15} /> },
  { label: 'Settings',     href: '/settings',     icon: <Settings size={15} /> },
]

const WORKSPACE_ITEMS: NavItem[] = [
  { label: 'Projects',     href: '/projects',     icon: <FolderKanban size={15} /> },
  { label: 'Org Overview', href: '/org',           icon: <Globe2 size={15} /> },
]

interface SidebarProps {
  savedViews: Pick<SavedView, 'id' | 'name'>[]
  projects: Project[]
  activeProject: Project | null
}

export function Sidebar({ savedViews, projects, activeProject }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside data-testid="sidebar" className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-12 items-center gap-2.5 border-b border-border px-4">
        <Activity size={16} className="text-primary" />
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          RIMAE
        </span>
        <span className="ml-auto rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
          KB
        </span>
      </div>

      {/* Project switcher */}
      <div className="border-b border-border py-2">
        <ProjectSwitcher projects={projects} activeProject={activeProject} />
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-testid={`nav-${item.href === '/' ? 'dashboard' : item.href.replace('/', '')}`}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <ChevronRight size={12} className="ml-auto opacity-50" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Workspace section */}
        <div className="mt-5">
          <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Workspace
          </p>
          <ul className="space-y-0.5">
            {WORKSPACE_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {item.label}
                    {isActive && (
                      <ChevronRight size={12} className="ml-auto opacity-50" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Saved Views quick links */}
        {savedViews.length > 0 && (
          <div className="mt-5">
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Quick Views
            </p>
            <ul className="space-y-0.5">
              {savedViews.map((view) => {
                const href = `/explorer?view=${view.id}`
                return (
                  <li key={view.id}>
                    <Link
                      href={href}
                      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    >
                      <span className="h-1 w-1 flex-shrink-0 rounded-full bg-current opacity-60" />
                      <span className="truncate">{view.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] text-sidebar-foreground/40">
          {activeProject ? `Project: ${activeProject.name}` : 'No project selected'}
        </p>
      </div>
    </aside>
  )
}
