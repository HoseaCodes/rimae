import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { IngestEventForm } from '@/components/forms/IngestEventForm'
import type { EventWithMeta } from '@/lib/database.types'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('events_with_meta')
    .select('title')
    .eq('id', id)
    .single()
  const row = data as { title: string } | null
  return { title: row ? `Edit: ${row.title}` : 'Edit Event' }
}

export const dynamic = 'force-dynamic'

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events_with_meta')
    .select('*')
    .eq('id', id)
    .single()

  if (!data || error) notFound()

  const event = data as EventWithMeta

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to Event
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Edit Event
        </h1>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {event.title}
        </p>
      </div>

      <IngestEventForm
        initialEvent={{
          id: event.id,
          title: event.title,
          summary: event.summary,
          raw_text: event.raw_text,
          event_type: event.event_type,
          category: event.category,
          severity: event.severity,
          status: event.status,
          event_timestamp: event.event_timestamp,
          tag_names: event.tag_names,
          source_name: event.source_name,
          source_type: event.source_type,
        }}
      />
    </div>
  )
}
