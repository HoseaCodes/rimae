import { cn } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { EventCategory } from '@/lib/database.types'

interface CategoryBadgeProps {
  category: EventCategory
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium leading-none text-muted-foreground',
        className
      )}
    >
      {CATEGORY_LABELS[category]}
    </span>
  )
}
