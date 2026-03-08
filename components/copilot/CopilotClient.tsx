'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, Send, Loader2, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { askCopilotAction } from '@/lib/actions/copilot'
import type { CopilotAnswer, CopilotSource, QuestionType } from '@/lib/copilot/types'
import { cn } from '@/lib/utils'

// ─── Starter questions ────────────────────────────────────────────────────────

const STARTER_QUESTIONS = [
  "Generate a briefing for today's work",
  'What were the main auth issues?',
  'Summarize all launch blockers',
  'Why did we make recent product decisions?',
  'What follow-ups still need a decision?',
  'What changed in the last 7 days?',
]

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  briefing_today: 'Daily Briefing',
  blocker_summary: 'Blocker Summary',
  issue_summary: 'Issue Summary',
  decision_why: 'Decision Analysis',
  open_questions: 'Open Questions',
  timeline_summary: 'Timeline Summary',
  current_status: 'Current Status',
  general_project_question: 'Project Q&A',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CopilotClientProps {
  aiEnabled: boolean
  projectName?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CopilotClient({ aiEnabled, projectName }: CopilotClientProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<CopilotAnswer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sourcesOpen, setSourcesOpen] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showDateFilters, setShowDateFilters] = useState(false)
  const [isPending, startTransition] = useTransition()
  const answerRef = useRef<HTMLDivElement>(null)

  // Scroll to answer when it arrives
  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [answer])

  function handleSubmit(q: string) {
    const trimmed = q.trim()
    if (!trimmed || isPending) return
    setQuestion(trimmed)
    setAnswer(null)
    setError(null)

    startTransition(async () => {
      const result = await askCopilotAction(trimmed, {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      if (result.success) {
        setAnswer(result.data)
        setSourcesOpen(true)
      } else {
        setError(result.error)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(question)
    }
  }

  // ── AI disabled state ──────────────────────────────────────────────────────
  if (!aiEnabled) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center">
        <Sparkles size={32} className="text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium text-foreground">Knowledge Copilot is unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            AI features are currently disabled. Enable AI in{' '}
            <Link href="/settings" className="underline underline-offset-4 hover:text-foreground">
              Settings
            </Link>{' '}
            to use Copilot.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/settings">Go to Settings</Link>
        </Button>
      </div>
    )
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* Input card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Ask a question
            {projectName && <span className="ml-1 normal-case font-normal">— {projectName}</span>}
          </span>
        </div>

        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. What were the main auth issues? · Summarize launch blockers · Generate today's briefing"
          className="min-h-[80px] resize-none text-sm"
          disabled={isPending}
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDateFilters(!showDateFilters)}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Calendar size={12} />
              Date filter
              {showDateFilters ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            {(dateFrom || dateTo) && (
              <span className="text-xs text-muted-foreground">
                {dateFrom && `from ${dateFrom}`}{dateFrom && dateTo && ' · '}{dateTo && `to ${dateTo}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground hidden sm:block">⌘↵ to send</span>
            <Button
              size="sm"
              onClick={() => handleSubmit(question)}
              disabled={!question.trim() || isPending}
              className="gap-1.5"
            >
              {isPending ? (
                <><Loader2 size={13} className="animate-spin" />Thinking…</>
              ) : (
                <><Send size={13} />Ask</>
              )}
            </Button>
          </div>
        </div>

        {/* Date range inputs */}
        {showDateFilters && (
          <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-16">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-16">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Starter questions */}
      {!answer && !isPending && !error && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Suggested questions
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSubmit(q)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isPending && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin text-primary" />
          <span>Searching project records and synthesizing answer…</span>
        </div>
      )}

      {/* Error state */}
      {error && !isPending && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Could not generate answer</p>
            <p className="mt-0.5 text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Answer */}
      {answer && !isPending && (
        <div ref={answerRef} className="flex flex-col gap-4">

          {/* Answer header */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <Sparkles size={10} className="text-primary" />
              {QUESTION_TYPE_LABELS[answer.questionType]}
            </Badge>
            <ConfidenceBadge confidence={answer.confidence} />
            <span className="ml-auto text-[11px] text-muted-foreground">
              {answer.sources.length} source{answer.sources.length !== 1 ? 's' : ''} used
            </span>
          </div>

          {/* Answer text */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <AnswerText text={answer.answer} />
          </div>

          {/* Sources */}
          {answer.sources.length > 0 && (
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <button
                type="button"
                onClick={() => setSourcesOpen(!sourcesOpen)}
                className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                <span>Sources used ({answer.sources.length})</span>
                {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {sourcesOpen && (
                <div className="border-t border-border px-4 py-3">
                  <ul className="flex flex-col gap-2">
                    {answer.sources.map((source) => (
                      <SourceItem key={source.id} source={source} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Follow-up suggestions */}
          {answer.suggestedFollowUps.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Follow-up questions
              </p>
              <div className="flex flex-wrap gap-2">
                {answer.suggestedFollowUps.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSubmit(q)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnswerText({ text }: { text: string }) {
  // Render the answer as simple prose, preserving line breaks and bold/bullet formatting
  const lines = text.split('\n')
  return (
    <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />

        // Headings (## or ###)
        if (/^#{1,3}\s/.test(line)) {
          return (
            <p key={i} className="font-semibold text-foreground mt-2">
              {line.replace(/^#+\s/, '')}
            </p>
          )
        }

        // Bullet points
        if (/^[-*]\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60" />
              <span>{renderInlineBold(line.slice(2))}</span>
            </div>
          )
        }

        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)/)
          return (
            <div key={i} className="flex gap-2">
              <span className="flex-shrink-0 text-xs font-medium text-muted-foreground w-4 text-right">{match?.[1]}.</span>
              <span>{renderInlineBold(match?.[2] ?? '')}</span>
            </div>
          )
        }

        return <p key={i}>{renderInlineBold(line)}</p>
      })}
    </div>
  )
}

function renderInlineBold(text: string): React.ReactNode {
  // Convert **text** to <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function SourceItem({ source }: { source: CopilotSource }) {
  const typeLabels: Record<CopilotSource['type'], string> = {
    event: 'Event',
    follow_up: 'Follow-up',
    checklist_item: 'Checklist',
  }

  const typeColors: Record<CopilotSource['type'], string> = {
    event: 'text-blue-500',
    follow_up: 'text-amber-500',
    checklist_item: 'text-emerald-500',
  }

  const content = (
    <div className="flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50">
      <div className="flex items-start gap-2 min-w-0">
        <span className={cn('mt-0.5 flex-shrink-0 text-[10px] font-semibold uppercase', typeColors[source.type])}>
          {typeLabels[source.type]}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{source.title}</p>
          {source.subtitle && (
            <p className="text-[11px] text-muted-foreground">{source.subtitle}</p>
          )}
        </div>
      </div>
      {source.href && <ExternalLink size={11} className="mt-0.5 flex-shrink-0 text-muted-foreground/50" />}
    </div>
  )

  if (source.href) {
    return (
      <li>
        <Link href={source.href}>{content}</Link>
      </li>
    )
  }
  return <li>{content}</li>
}

function ConfidenceBadge({ confidence }: { confidence: CopilotAnswer['confidence'] }) {
  const config = {
    high: { label: 'High context', className: 'border-emerald-500/30 text-emerald-600' },
    medium: { label: 'Medium context', className: 'border-amber-500/30 text-amber-600' },
    low: { label: 'Low context', className: 'border-zinc-500/30 text-zinc-500' },
  }[confidence]

  return (
    <Badge variant="outline" className={cn('text-xs font-normal', config.className)}>
      {config.label}
    </Badge>
  )
}
