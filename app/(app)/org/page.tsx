import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  FolderKanban,
  Activity,
  AlertTriangle,
  GitPullRequest,
  Pin,
  TrendingUp,
  Globe2,
} from 'lucide-react'
import { getOrgStats, getPerProjectStats, getRecentEventsAllProjects } from '@/lib/projects/queries'
import { SeverityBadge } from '@/components/shared/SeverityBadge'
import { StatusBadge } from '@/components/shared/StatusBadge'

export const metadata: Metadata = { title: 'Org Overview' }
export const dynamic = 'force-dynamic'

export default async function OrgPage() {
  const [orgStats, projectStats, recentEvents] = await Promise.all([
    getOrgStats(),
    getPerProjectStats(),
    getRecentEventsAllProjects(15),
  ])

  // Build project name lookup for recent events
  const projectsMap = Object.fromEntries(
    projectStats.map(({ project }) => [project.id, project.name])
  )

  const statCards = [
    { label: 'Projects',        value: orgStats.projectCount,    icon: <FolderKanban size={14} /> },
    { label: 'Total Events',    value: orgStats.totalEvents,     icon: <Activity size={14} /> },
    { label: 'Open Events',     value: orgStats.openEvents,      icon: <TrendingUp size={14} /> },
    { label: 'Open Follow-Ups', value: orgStats.openFollowUps,   icon: <GitPullRequest size={14} /> },
    { label: 'Blocked',         value: orgStats.blockedFollowUps,icon: <AlertTriangle size={14} /> },
    { label: 'Needs Decision',  value: orgStats.needsDecision,   icon: <GitPullRequest size={14} /> },
    { label: 'Pinned Events',   value: orgStats.pinnedEvents,    icon: <Pin size={14} /> },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe2 size={20} className="text-primary" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Org Overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Aggregated view across all {orgStats.projectCount} project{orgStats.projectCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {statCards.map(({ label, value, icon }) => (
          <div key={label} className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {icon}
              <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Recent activity across all projects */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity — All Projects</h2>
            <Link
              href="/explorer?scope=all"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Search all →
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No events yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Event</th>
                    <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground sm:table-cell">Project</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Severity</th>
                    <th className="hidden px-3 py-2 text-left text-xs font-medium text-muted-foreground md:table-cell">Status</th>
                    <th className="hidden px-3 py-2 text-right text-xs font-medium text-muted-foreground lg:table-cell">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentEvents.map((event) => (
                    <tr key={event.id} className="group transition-colors hover:bg-muted/20">
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/events/${event.id}`}
                          className="block truncate font-medium text-foreground transition-colors group-hover:text-primary"
                        >
                          {event.title}
                        </Link>
                      </td>
                      <td className="hidden px-3 py-2.5 sm:table-cell">
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                          {projectsMap[event.project_id] ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <SeverityBadge severity={event.severity} />
                      </td>
                      <td className="hidden px-3 py-2.5 md:table-cell">
                        <StatusBadge status={event.status} />
                      </td>
                      <td className="hidden px-3 py-2.5 text-right text-xs text-muted-foreground lg:table-cell">
                        {formatDistanceToNow(new Date(event.event_timestamp), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per-project breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
            <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground">
              Manage →
            </Link>
          </div>

          <div className="space-y-2">
            {projectStats.map(({ project, eventCount, openCount, criticalHighCount }) => (
              <Link
                key={project.id}
                href="/projects"
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/20"
              >
                <FolderKanban size={14} className="mt-0.5 shrink-0 text-muted-foreground/60" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{eventCount} events</span>
                    <span>{openCount} open</span>
                    {criticalHighCount > 0 && (
                      <span className="text-orange-400">{criticalHighCount} crit/high</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {projectStats.length === 0 && (
              <p className="text-xs text-muted-foreground">No projects yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
