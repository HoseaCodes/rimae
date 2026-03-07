'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CATEGORY_OPTIONS,
  EVENT_TYPE_OPTIONS,
  SEVERITY_OPTIONS,
  STATUS_OPTIONS,
  SOURCE_TYPE_OPTIONS,
} from '@/lib/constants'
import { createEventAction, updateEventAction } from '@/lib/actions/events'
import type { EventFormValues } from '@/lib/schemas'
import type { EventCategory, EventSeverity, EventStatus, EventType, SourceType } from '@/lib/database.types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InitialEvent {
  id: string
  title: string
  summary: string | null
  raw_text: string
  event_type: EventType
  category: EventCategory
  severity: EventSeverity
  status: EventStatus
  event_timestamp: string
  tag_names: string[]
  source_name: string | null
  source_type: SourceType | null
}

interface IngestEventFormProps {
  initialEvent?: InitialEvent
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDatetimeString(isoString: string): string {
  const d = new Date(isoString)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

function nowLocalDatetime(): string {
  return toLocalDatetimeString(new Date().toISOString())
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-400">{message}</p>
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  )
}

function FormField({
  label,
  required,
  children,
  error,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  )
}


// ─── Main form component ──────────────────────────────────────────────────────

export function IngestEventForm({ initialEvent }: IngestEventFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [globalError, setGlobalError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const isEdit = !!initialEvent

  // Form state
  const [values, setValues] = useState<EventFormValues>({
    title: initialEvent?.title ?? '',
    summary: initialEvent?.summary ?? '',
    raw_text: initialEvent?.raw_text ?? '',
    event_type: initialEvent?.event_type ?? 'log',
    category: initialEvent?.category ?? 'general',
    severity: initialEvent?.severity ?? 'medium',
    status: initialEvent?.status ?? 'open',
    event_timestamp: initialEvent
      ? toLocalDatetimeString(initialEvent.event_timestamp)
      : nowLocalDatetime(),
    tags_raw: initialEvent?.tag_names.join(', ') ?? '',
    // Source fields (create only)
    source_name: '',
    source_type: 'manual',
    source_url: '',
  })

  const set = (key: keyof EventFormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError('')
    setFieldErrors({})

    startTransition(async () => {
      const result = isEdit
        ? await updateEventAction(initialEvent.id, values)
        : await createEventAction(values)

      if (!result.success) {
        setGlobalError(result.error)
        if (result.fieldErrors) setFieldErrors(result.fieldErrors)
        return
      }

      router.push(`/events/${result.data.eventId}`)
    })
  }

  const firstError = (key: keyof EventFormValues) => fieldErrors[key]?.[0]

  return (
    <form data-testid="ingest-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Global error */}
      {globalError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {globalError}
        </div>
      )}

      {/* Content */}
      <FormSection title="Content">
        <FormField label="Title" required error={firstError('title')}>
          <Input
            data-testid="input-title"
            value={values.title}
            onChange={(e) => set('title')(e.target.value)}
            placeholder="e.g. GitHub OAuth callback breaks with Brave Shields enabled"
            className="text-sm"
          />
        </FormField>

        <FormField label="Summary" error={firstError('summary')}>
          <Textarea
            value={values.summary}
            onChange={(e) => set('summary')(e.target.value)}
            placeholder="Brief one-paragraph summary (optional, can be left empty)"
            className="resize-none text-sm"
            rows={2}
          />
        </FormField>

        <FormField label="Raw Content" required error={firstError('raw_text')}>
          <Textarea
            data-testid="input-raw-text"
            value={values.raw_text}
            onChange={(e) => set('raw_text')(e.target.value)}
            placeholder="Paste the full text, chat log, notes, or decision context here..."
            className="font-mono text-xs leading-relaxed"
            rows={12}
          />
        </FormField>
      </FormSection>

      {/* Classification */}
      <FormSection title="Classification">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category" required error={firstError('category')}>
            <Select value={values.category} onValueChange={set('category')}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Event Type" required error={firstError('event_type')}>
            <Select value={values.event_type} onValueChange={set('event_type')}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Severity" required error={firstError('severity')}>
            <Select value={values.severity} onValueChange={set('severity')}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Status" required error={firstError('status')}>
            <Select value={values.status} onValueChange={set('status')}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField label="Event Date" required error={firstError('event_timestamp')}>
          <Input
            type="datetime-local"
            value={values.event_timestamp}
            onChange={(e) => set('event_timestamp')(e.target.value)}
            className="text-sm"
          />
        </FormField>

        <FormField label="Tags" error={firstError('tags_raw')}>
          <Input
            value={values.tags_raw}
            onChange={(e) => set('tags_raw')(e.target.value)}
            placeholder="oauth, auth, security (comma-separated)"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground/60">
            Separate tags with commas. New tags are created automatically.
          </p>
        </FormField>
      </FormSection>

      {/* Source (create only) */}
      {!isEdit && (
        <FormSection title="Source">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Source Name" error={firstError('source_name')}>
              <Input
                value={values.source_name}
                onChange={(e) => set('source_name')(e.target.value)}
                placeholder="e.g. ChatGPT OAuth Debug Session"
                className="text-sm"
              />
            </FormField>

            <FormField label="Source Type" error={firstError('source_type')}>
              <Select
                value={values.source_type ?? 'manual'}
                onValueChange={set('source_type')}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Source URL" error={firstError('source_url')}>
            <Input
              type="url"
              value={values.source_url}
              onChange={(e) => set('source_url')(e.target.value)}
              placeholder="https://chatgpt.com/c/..."
              className="text-sm"
            />
          </FormField>
        </FormSection>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          data-testid="cancel-button"
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button data-testid="submit-button" type="submit" disabled={isPending}>
          {isPending
            ? isEdit ? 'Saving...' : 'Creating...'
            : isEdit ? 'Save Changes' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}
