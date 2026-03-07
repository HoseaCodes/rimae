'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExplorerEvent } from '@/components/explorer/EventsTable'

interface ExportButtonProps {
  events: ExplorerEvent[]
}

function formatEventForExport(event: ExplorerEvent): string {
  const lines: string[] = []
  lines.push(`[${event.severity.toUpperCase()}] ${event.title}`)
  lines.push(`Type: ${event.event_type} | Category: ${event.category} | Status: ${event.status}`)
  lines.push(`Date: ${new Date(event.event_timestamp).toISOString().split('T')[0]}`)
  if (event.source_name) lines.push(`Source: ${event.source_name}${event.source_type ? ` (${event.source_type})` : ''}`)
  if (event.summary) lines.push(`Summary: ${event.summary}`)
  if (event.tag_names.length > 0) lines.push(`Tags: ${event.tag_names.join(', ')}`)
  return lines.join(String.fromCharCode(10))
}

export function ExportButton({ events }: ExportButtonProps) {
  const [copied, setCopied] = useState(false)

  if (events.length === 0) return null

  const handleCopy = async () => {
    const NL = String.fromCharCode(10)
    const header = `RIMAE Export — ${events.length} event${events.length !== 1 ? 's' : ''} — ${new Date().toISOString().split('T')[0]}`
    const separator = '='.repeat(60)
    const divider = NL + NL + '-'.repeat(40) + NL + NL
    const body = events.map(formatEventForExport).join(divider)
    const text = [header, separator, body].join(NL)

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rimae-export-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-8 gap-1.5 text-xs"
      title={`Copy ${events.length} events to clipboard for AI context`}
    >
      {copied ? (
        <>
          <Check size={12} className="text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy size={12} />
          Export
        </>
      )}
    </Button>
  )
}
