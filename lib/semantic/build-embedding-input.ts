// ─── Embedding Input Builder ──────────────────────────────────────────────────
// Produces a deterministic, structured text representation of an event for
// embedding. Consistent across ingest, backfill, and semantic search queries.
//
// Total character budget: ~8 000 (OpenAI text-embedding-3-small context limit).
// Layout: title (always) → summary (if present) → raw_text (fills remainder).

const TITLE_BUDGET     = 200
const SUMMARY_BUDGET   = 500
const RAW_TEXT_BUDGET  = 7200  // remainder after title + summary + separators

export function buildEmbeddingInput(fields: {
  title:    string
  summary?: string | null
  raw_text: string
}): string {
  const parts: string[] = []

  parts.push(fields.title.slice(0, TITLE_BUDGET))

  if (fields.summary) {
    parts.push(fields.summary.slice(0, SUMMARY_BUDGET))
  }

  parts.push(fields.raw_text.slice(0, RAW_TEXT_BUDGET))

  return parts.join('\n\n')
}

// ─── Similarity label helpers ─────────────────────────────────────────────────

export type SimilarityLabel = 'very similar' | 'related' | 'possibly related'

export function getSimilarityLabel(score: number): SimilarityLabel {
  if (score >= 0.88) return 'very similar'
  if (score >= 0.78) return 'related'
  return 'possibly related'
}

export function getSimilarityColor(label: SimilarityLabel): string {
  switch (label) {
    case 'very similar':    return 'text-emerald-400'
    case 'related':         return 'text-blue-400'
    case 'possibly related': return 'text-zinc-400'
  }
}
