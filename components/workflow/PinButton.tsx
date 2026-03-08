'use client'

import { useTransition } from 'react'
import { Pin, PinOff } from 'lucide-react'
import { pinEventAction, unpinEventAction } from '@/lib/actions/workflow'

interface PinButtonProps {
  eventId: string
  isPinned: boolean
}

export function PinButton({ eventId, isPinned }: PinButtonProps) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      if (isPinned) {
        await unpinEventAction(eventId)
      } else {
        await pinEventAction(eventId)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={isPinned ? 'Unpin event' : 'Pin event'}
      className={[
        'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
        isPinned
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
      ].join(' ')}
    >
      {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
      {isPinned ? 'Unpin' : 'Pin'}
    </button>
  )
}
