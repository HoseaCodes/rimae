'use client'

import { useState } from 'react'
import { TIME_WINDOW_LABELS } from '@/lib/observability/types'
import type { TimeWindow } from '@/lib/observability/types'

interface TimeWindowTabsProps {
  defaultWindow?: TimeWindow
  onChange: (window: TimeWindow) => void
}

export function TimeWindowTabs({ defaultWindow = '30d', onChange }: TimeWindowTabsProps) {
  const [active, setActive] = useState<TimeWindow>(defaultWindow)
  const windows: TimeWindow[] = ['7d', '30d', '90d']

  function select(w: TimeWindow) {
    setActive(w)
    onChange(w)
  }

  return (
    <div className="flex gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
      {windows.map((w) => (
        <button
          key={w}
          onClick={() => select(w)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            active === w
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {TIME_WINDOW_LABELS[w]}
        </button>
      ))}
    </div>
  )
}
