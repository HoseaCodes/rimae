import Link from 'next/link'
import { TrendingUp, AlertTriangle, CheckCircle, Zap, Shield, Tag } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { SummaryMetrics } from '@/lib/observability/types'

interface SummaryCardsProps {
  metrics: SummaryMetrics
}

export function SummaryCards({ metrics }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Events this week',
      value: metrics.totalLast7Days,
      icon: <TrendingUp size={14} className="text-blue-400" />,
      color: 'text-blue-400',
    },
    {
      label: 'Open issues',
      value: metrics.openIssues,
      icon: <AlertTriangle size={14} className="text-yellow-400" />,
      color: 'text-yellow-400',
      href: '/explorer?status=open',
    },
    {
      label: 'Resolved this week',
      value: metrics.resolvedLast7Days,
      icon: <CheckCircle size={14} className="text-emerald-400" />,
      color: 'text-emerald-400',
    },
    {
      label: 'High/Critical (7d)',
      value: metrics.criticalHighLast7Days,
      icon: <Zap size={14} className="text-red-400" />,
      color: 'text-red-400',
      href: '/explorer?severity=critical,high',
    },
    {
      label: 'Open blockers',
      value: metrics.openBlockers,
      icon: <Shield size={14} className="text-orange-400" />,
      color: metrics.openBlockers > 0 ? 'text-orange-400' : 'text-muted-foreground',
      urgent: metrics.openBlockers > 0,
    },
    {
      label: 'Top category',
      value: metrics.topCategoryThisWeek
        ? `${CATEGORY_LABELS[metrics.topCategoryThisWeek]} (${metrics.topCategoryThisWeekCount})`
        : '—',
      icon: <Tag size={14} className="text-violet-400" />,
      color: 'text-violet-400',
      isText: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const inner = (
          <div
            className={`rounded-lg border bg-card p-3 transition-colors ${
              card.href ? 'hover:border-border/80 hover:bg-card/80 cursor-pointer' : ''
            } ${card.urgent ? 'border-orange-500/30 bg-orange-500/5' : 'border-border'}`}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {card.icon}
              <span className="text-[11px] font-medium">{card.label}</span>
            </div>
            <div className={`mt-1.5 font-semibold ${card.isText ? 'text-sm truncate' : 'text-xl'} ${card.color}`}>
              {card.isText ? card.value : typeof card.value === 'number' ? card.value : card.value}
            </div>
          </div>
        )

        return card.href ? (
          <Link key={card.label} href={card.href}>
            {inner}
          </Link>
        ) : (
          <div key={card.label}>{inner}</div>
        )
      })}
    </div>
  )
}
