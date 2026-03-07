import { Activity } from 'lucide-react'
import { fetchObservabilityData } from '@/lib/observability/queries'
import { SummaryCards } from '@/components/observability/SummaryCards'
import { EventTimeline } from '@/components/observability/EventTimeline'
import { IssueFrequencyChart } from '@/components/observability/IssueFrequencyChart'
import { CategoryTrendChart } from '@/components/observability/CategoryTrendChart'
import { SeverityTrendChart } from '@/components/observability/SeverityTrendChart'
import { LaunchBlockerSection } from '@/components/observability/LaunchBlockerSection'
import { TopTopicsPanel } from '@/components/observability/TopTopicsPanel'
import { OpenVsResolved } from '@/components/observability/OpenVsResolved'

export const dynamic = 'force-dynamic'

export default async function ObservabilityPage() {
  const { summary, chartDatasets, timeline, health, topTopics, openBlockers, recentlyResolvedBlockers } =
    await fetchObservabilityData()

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-muted-foreground" />
        <h1 className="text-base font-semibold text-foreground">Observability</h1>
        <span className="text-xs text-muted-foreground">— project health &amp; trends</span>
      </div>

      {/* Summary cards */}
      <SummaryCards metrics={summary} />

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <IssueFrequencyChart datasets={chartDatasets} />
        <SeverityTrendChart datasets={chartDatasets} />
      </div>

      {/* Category trend — full width */}
      <CategoryTrendChart datasets={chartDatasets} />

      {/* Bottom row: blockers + topics + health */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TopTopicsPanel topics={topTopics} />
        </div>
        <div className="lg:col-span-1">
          <OpenVsResolved health={health} />
        </div>
        <div className="lg:col-span-1">
          {/* placeholder for future widget */}
        </div>
      </div>

      {/* Launch blockers */}
      <LaunchBlockerSection openBlockers={openBlockers} recentlyResolved={recentlyResolvedBlockers} />

      {/* Timeline */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Event Timeline</h2>
          <span className="text-[11px] text-muted-foreground">Last 30 days · newest first</span>
        </div>
        <EventTimeline days={timeline} />
      </div>
    </div>
  )
}
