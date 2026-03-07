import type { Metadata } from 'next'
import { IngestEventForm } from '@/components/forms/IngestEventForm'

export const metadata: Metadata = { title: 'Ingest Event' }

export default function IngestPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Ingest Event
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Capture a new event into the VCTRL knowledge base.
        </p>
      </div>
      <IngestEventForm />
    </div>
  )
}
