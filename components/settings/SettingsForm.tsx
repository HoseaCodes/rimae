'use client'

import { useState, useTransition } from 'react'
import { updateSettingsAction } from '@/lib/actions/settings'
import { backfillEmbeddingsAction } from '@/lib/actions/enrich'
import type { AppSettings, AIProvider } from '@/lib/database.types'

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'ollama_local', label: 'Ollama (Local)' },
  { value: 'openai',       label: 'OpenAI' },
  { value: 'claude',       label: 'Claude (Anthropic)' },
]

const MODEL_HINTS: Record<AIProvider, string> = {
  ollama_local: 'Examples: llama3, mistral, phi3, gemma2',
  openai:       'Examples: gpt-4o-mini, gpt-4o',
  claude:       'Examples: claude-3-5-sonnet-latest, claude-haiku-4-5-20251001',
}

const ENV_WARNINGS: Partial<Record<AIProvider, string>> = {
  openai: 'Requires OPENAI_API_KEY in your environment variables.',
  claude: 'Requires ANTHROPIC_API_KEY in your environment variables.',
}

interface Props {
  initial: AppSettings
  /** Server-side env warning pre-computed to avoid exposing process.env to client */
  envWarning: string | null
}

export function SettingsForm({ initial, envWarning: initialEnvWarning }: Props) {
  const [settings, setSettings] = useState<AppSettings>(initial)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [backfillPending, startBackfill] = useTransition()
  const [backfillResult, setBackfillResult] = useState<string | null>(null)
  const [backfillError, setBackfillError] = useState<string | null>(null)

  function handleBackfill() {
    setBackfillResult(null)
    setBackfillError(null)
    startBackfill(async () => {
      const result = await backfillEmbeddingsAction()
      if (result.success) {
        setBackfillResult(
          result.data.processed === 0
            ? 'All events already have embeddings.'
            : `Done — ${result.data.processed} event${result.data.processed !== 1 ? 's' : ''} embedded.`
        )
      } else {
        setBackfillError(result.error ?? 'Backfill failed.')
      }
    })
  }

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  function activeModel(): string {
    if (settings.ai_provider === 'openai')  return settings.openai_model
    if (settings.ai_provider === 'claude')  return settings.claude_model
    return settings.ollama_model
  }

  function setActiveModel(val: string) {
    if (settings.ai_provider === 'openai')  set('openai_model', val)
    else if (settings.ai_provider === 'claude') set('claude_model', val)
    else set('ollama_model', val)
  }

  // Compute env warning client-side when provider changes from initial
  const clientEnvWarning =
    settings.ai_provider !== initial.ai_provider
      ? ENV_WARNINGS[settings.ai_provider] ?? null
      : initialEnvWarning

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await updateSettingsAction(settings)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setSaveError(result.error ?? 'Unknown error')
      }
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Master toggle ───────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Enable AI Features</h2>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              When disabled, all LLM enrichment actions are skipped. Extractive summaries
              still run on ingest. Provider settings can be configured but remain inactive.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.ai_enabled}
            onClick={() => set('ai_enabled', !settings.ai_enabled)}
            className="flex-shrink-0 flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none"
            style={{
              background: settings.ai_enabled ? 'hsl(var(--primary))' : 'transparent',
              borderColor: settings.ai_enabled ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              color: settings.ai_enabled ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: settings.ai_enabled ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
              }}
            />
            {settings.ai_enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {!settings.ai_enabled && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-600" />
            AI features are off. Enable the toggle to activate enrichment actions.
          </div>
        )}
      </section>

      {/* ── Provider config ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-5">
        <h2 className="text-sm font-semibold text-foreground">AI Provider</h2>

        {/* Provider */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">Provider</label>
          <select
            value={settings.ai_provider}
            onChange={(e) => set('ai_provider', e.target.value as AIProvider)}
            className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">Model</label>
          <input
            type="text"
            value={activeModel()}
            onChange={(e) => setActiveModel(e.target.value)}
            className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-[11px] text-muted-foreground/70">
            {MODEL_HINTS[settings.ai_provider]}
          </p>
        </div>

        {/* Embedding model (OpenAI only) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            Embedding Model
            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground/50">(OpenAI — used for semantic search &amp; related events)</span>
          </label>
          <input
            type="text"
            value={settings.openai_embedding_model}
            onChange={(e) => set('openai_embedding_model', e.target.value)}
            className="w-full max-w-xs rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-[11px] text-muted-foreground/70">
            Recommended: text-embedding-3-small (1536 dims). Requires OPENAI_API_KEY.
          </p>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Temperature —{' '}
            <span className="font-mono text-foreground">{settings.temperature.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.temperature}
            onChange={(e) => set('temperature', parseFloat(e.target.value))}
            className="w-full max-w-xs accent-primary"
          />
          <div className="flex max-w-xs justify-between text-[10px] text-muted-foreground/50">
            <span>0 — Deterministic</span>
            <span>1 — Creative</span>
          </div>
        </div>

        {/* Env warning */}
        {clientEnvWarning && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-400">
            <span className="mt-0.5 flex-shrink-0">⚠</span>
            <span>{clientEnvWarning}</span>
          </div>
        )}

        {settings.ai_provider === 'ollama_local' && (
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <span className="mt-0.5 flex-shrink-0">ℹ</span>
            <span>Ollama must be running locally at <span className="font-mono">http://localhost:11434</span> with the selected model pulled.</span>
          </div>
        )}
      </section>

      {/* ── Embeddings ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Embeddings</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate embeddings for all events that are missing them (up to 20 at a time).
            Requires AI enabled and <span className="font-mono">OPENAI_API_KEY</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackfill}
            disabled={backfillPending || !settings.ai_enabled}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:enabled:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {backfillPending ? 'Backfilling…' : 'Backfill Embeddings'}
          </button>
          {backfillResult && <span className="text-xs text-emerald-400">{backfillResult}</span>}
          {backfillError  && <span className="text-xs text-red-400">{backfillError}</span>}
        </div>
      </section>

      {/* ── Save ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save Settings'}
        </button>
        {saved    && <span className="text-xs text-emerald-400">Settings saved.</span>}
        {saveError && <span className="text-xs text-red-400">{saveError}</span>}
      </div>
    </div>
  )
}
