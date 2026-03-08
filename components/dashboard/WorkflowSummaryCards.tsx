import Link from 'next/link'
import { Pin, CheckSquare, AlertCircle, AlertTriangle } from 'lucide-react'

interface WorkflowSummaryCardsProps {
  openFollowUps:    number
  blockedFollowUps: number
  needsDecision:    number
  pinnedEvents:     number
}

export function WorkflowSummaryCards({
  openFollowUps,
  blockedFollowUps,
  needsDecision,
  pinnedEvents,
}: WorkflowSummaryCardsProps) {
  const cards = [
    {
      label:    'Open Follow-ups',
      value:    openFollowUps,
      icon:     <CheckSquare size={14} className="text-blue-400" />,
      href:     '/workflow',
      accent:   'border-blue-500/20',
      danger:   false,
    },
    {
      label:    'Blocked',
      value:    blockedFollowUps,
      icon:     <AlertTriangle size={14} className="text-red-400" />,
      href:     '/workflow?queue=blocked',
      accent:   blockedFollowUps > 0 ? 'border-red-500/30' : 'border-border',
      danger:   blockedFollowUps > 0,
    },
    {
      label:    'Needs Decision',
      value:    needsDecision,
      icon:     <AlertCircle size={14} className="text-purple-400" />,
      href:     '/workflow?queue=needs_decision',
      accent:   needsDecision > 0 ? 'border-purple-500/30' : 'border-border',
      danger:   false,
    },
    {
      label:    'Pinned Events',
      value:    pinnedEvents,
      icon:     <Pin size={14} className="text-amber-400" />,
      href:     '/#pinned',
      accent:   'border-border',
      danger:   false,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className={`flex items-center gap-3 rounded-lg border ${card.accent} bg-card px-4 py-3 transition-colors hover:bg-card/80`}
        >
          <span className="flex-shrink-0">{card.icon}</span>
          <div className="min-w-0">
            <p className={`text-xl font-bold tabular-nums ${card.danger ? 'text-red-400' : 'text-foreground'}`}>
              {card.value}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{card.label}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
