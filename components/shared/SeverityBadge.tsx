import { cn } from '@/lib/utils'
import { SEVERITY_LABELS, SEVERITY_STYLES } from '@/lib/constants'
import type { EventSeverity } from '@/lib/database.types'

interface SeverityBadgeProps {
  severity: EventSeverity
  className?: string
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none',
        SEVERITY_STYLES[severity],
        className
      )}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  )
}
