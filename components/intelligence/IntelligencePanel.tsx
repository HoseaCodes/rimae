'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw, Tag, Layers, Check, X, Cpu, ClipboardCopy } from 'lucide-react'
import {
  regenerateSummaryAction,
  suggestTagsAction,
  applyTagSuggestionsAction,
  suggestCategoryAction,
  applyCategoryAction,
  generateEventEmbeddingAction,
  generateContextPackAction,
} from '@/lib/actions/enrich'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { EventCategory } from '@/lib/database.types'

interface Props {
  eventId: string
  currentCategory: EventCategory
  aiEnabled: boolean
  qualityScore: number
  modelLabel: string
}

export function IntelligencePanel({
  eventId,
  currentCategory,
  aiEnabled,
  qualityScore,
  modelLabel,
}: Props) {
  const router = useRouter()

  // ── Summary ──────────────────────────────────────────────────────────────────
  const [newSummary, setNewSummary]       = useState<string | null>(null)
  const [summaryError, setSummaryError]   = useState<string | null>(null)
  const [summaryPending, startSummary]    = useTransition()

  // ── Tags ─────────────────────────────────────────────────────────────────────
  const [suggestedTags, setSuggestedTags]   = useState<string[] | null>(null)
  const [acceptedTags, setAcceptedTags]     = useState<Set<string>>(new Set())
  const [tagsError, setTagsError]           = useState<string | null>(null)
  const [tagsPending, startTags]            = useTransition()
  const [applyTagsPending, startApplyTags]  = useTransition()

  // ── Category ──────────────────────────────────────────────────────────────────
  const [suggestedCategory, setSuggestedCategory]   = useState<EventCategory | null>(null)
  const [categoryError, setCategoryError]           = useState<string | null>(null)
  const [categoryPending, startCategory]            = useTransition()
  const [applyCatPending, startApplyCat]            = useTransition()

  // ── Embedding ─────────────────────────────────────────────────────────────────
  const [embeddingDone, setEmbeddingDone]       = useState(false)
  const [embeddingError, setEmbeddingError]     = useState<string | null>(null)
  const [embeddingPending, startEmbedding]      = useTransition()

  // ── Context pack ──────────────────────────────────────────────────────────────
  const [packCopied, setPackCopied]   = useState(false)
  const [packError, setPackError]     = useState<string | null>(null)
  const [packPending, startPack]      = useTransition()

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleCopyContextPack() {
    setPackError(null)
    setPackCopied(false)
    startPack(async () => {
      const result = await generateContextPackAction(eventId)
      if (result.success) {
        await navigator.clipboard.writeText(result.data.markdown)
        setPackCopied(true)
        setTimeout(() => setPackCopied(false), 2500)
      } else {
        setPackError(result.error ?? 'Failed to generate context pack.')
      }
    })
  }

  function handleGenerateEmbedding() {
    setEmbeddingError(null)
    setEmbeddingDone(false)
    startEmbedding(async () => {
      const result = await generateEventEmbeddingAction(eventId)
      if (result.success) {
        setEmbeddingDone(true)
        router.refresh()
      } else {
        setEmbeddingError(result.error)
      }
    })
  }

  function handleRegenSummary() {
    setSummaryError(null)
    setNewSummary(null)
    startSummary(async () => {
      const result = await regenerateSummaryAction(eventId)
      if (result.success) {
        setNewSummary(result.data.summary)
        router.refresh()
      } else {
        setSummaryError(result.error)
      }
    })
  }

  function handleSuggestTags() {
    setTagsError(null)
    setSuggestedTags(null)
    startTags(async () => {
      const result = await suggestTagsAction(eventId)
      if (result.success) {
        setSuggestedTags(result.data.tags)
        setAcceptedTags(new Set(result.data.tags))
      } else {
        setTagsError(result.error)
      }
    })
  }

  function toggleTag(tag: string) {
    setAcceptedTags((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  function handleApplyTags() {
    startApplyTags(async () => {
      await applyTagSuggestionsAction(eventId, [...acceptedTags])
      setSuggestedTags(null)
      router.refresh()
    })
  }

  function handleSuggestCategory() {
    setCategoryError(null)
    setSuggestedCategory(null)
    startCategory(async () => {
      const result = await suggestCategoryAction(eventId)
      if (result.success) {
        setSuggestedCategory(result.data.category)
      } else {
        setCategoryError(result.error)
      }
    })
  }

  function handleApplyCategory() {
    if (!suggestedCategory) return
    startApplyCat(async () => {
      await applyCategoryAction(eventId, suggestedCategory)
      setSuggestedCategory(null)
      router.refresh()
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-5">

      {/* Quality score */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Record quality</span>
        <span className={`font-mono font-semibold ${
          qualityScore >= 70 ? 'text-emerald-400'
          : qualityScore >= 40 ? 'text-yellow-400'
          : 'text-red-400'
        }`}>
          {qualityScore}/100
        </span>
      </div>

      {/* AI status banner */}
      {aiEnabled ? (
        <div className="flex items-center gap-2 rounded-md bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
          AI active — {modelLabel}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-600" />
          AI is off.{' '}
          <Link href="/settings" className="text-primary hover:underline">
            Enable in Settings
          </Link>{' '}
          to use enrichment actions.
        </div>
      )}

      <div className="space-y-4">

        {/* ── Regenerate Summary ────────────────────────────────────────────── */}
        <div className="space-y-2">
          <button
            disabled={!aiEnabled || summaryPending}
            onClick={handleRegenSummary}
            className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:enabled:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={11} className={summaryPending ? 'animate-spin' : ''} />
            {summaryPending ? 'Generating summary…' : 'Regenerate Summary'}
          </button>
          {summaryError && (
            <p className="text-xs text-red-400">{summaryError}</p>
          )}
          {newSummary && (
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                Summary updated
              </p>
              <p className="text-xs leading-relaxed text-foreground/80">{newSummary}</p>
            </div>
          )}
        </div>

        {/* ── Suggest Tags ──────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <button
            disabled={!aiEnabled || tagsPending}
            onClick={handleSuggestTags}
            className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:enabled:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Tag size={11} className={tagsPending ? 'animate-pulse' : ''} />
            {tagsPending ? 'Suggesting tags…' : 'Suggest Tags'}
          </button>
          {tagsError && <p className="text-xs text-red-400">{tagsError}</p>}
          {suggestedTags && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Click a tag to toggle. Strikethrough = rejected.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTags.map((tag) => {
                  const on = acceptedTags.has(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                        on
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-zinc-800 text-zinc-500 line-through'
                      }`}
                    >
                      {on ? <Check size={9} /> : <X size={9} />}
                      {tag}
                    </button>
                  )
                })}
              </div>
              <button
                disabled={acceptedTags.size === 0 || applyTagsPending}
                onClick={handleApplyTags}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-40"
              >
                {applyTagsPending
                  ? 'Applying…'
                  : `Apply ${acceptedTags.size} tag${acceptedTags.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>

        {/* ── Suggest Category ──────────────────────────────────────────────── */}
        <div className="space-y-2">
          <button
            disabled={!aiEnabled || categoryPending}
            onClick={handleSuggestCategory}
            className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:enabled:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Layers size={11} className={categoryPending ? 'animate-pulse' : ''} />
            {categoryPending ? 'Classifying…' : 'Suggest Category'}
          </button>
          {categoryError && <p className="text-xs text-red-400">{categoryError}</p>}
          {suggestedCategory && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Suggested:</span>
              <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {CATEGORY_LABELS[suggestedCategory]}
              </span>
              {suggestedCategory === currentCategory ? (
                <span className="text-xs text-muted-foreground/50">(already set)</span>
              ) : (
                <button
                  disabled={applyCatPending}
                  onClick={handleApplyCategory}
                  className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                >
                  <Check size={9} />
                  {applyCatPending ? 'Applying…' : 'Apply'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Generate Embedding ────────────────────────────────────────────── */}
        <div className="space-y-2">
          <button
            disabled={!aiEnabled || embeddingPending}
            onClick={handleGenerateEmbedding}
            className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:enabled:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Cpu size={11} className={embeddingPending ? 'animate-pulse' : ''} />
            {embeddingPending ? 'Generating embedding…' : 'Generate Embedding'}
          </button>
          {embeddingError && <p className="text-xs text-red-400">{embeddingError}</p>}
          {embeddingDone && (
            <p className="text-xs text-emerald-400">Embedding saved. Related events now active.</p>
          )}
        </div>

        {/* ── Copy Context Pack ─────────────────────────────────────────────── */}
        <div className="space-y-2 border-t border-border pt-4">
          <button
            disabled={packPending}
            onClick={handleCopyContextPack}
            className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:enabled:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ClipboardCopy size={11} className={packPending ? 'animate-pulse' : ''} />
            {packCopied ? 'Copied to clipboard!' : packPending ? 'Building pack…' : 'Copy Context Pack'}
          </button>
          {packError && <p className="text-xs text-red-400">{packError}</p>}
          {packCopied && (
            <p className="text-xs text-emerald-400">
              Markdown context pack copied — paste into any LLM chat.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
