import { cn } from '@/lib/utils'
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/constants'
import type { EventStatus } from '@/lib/database.types'

interface StatusBadgeProps {
  status: EventStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none',
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
