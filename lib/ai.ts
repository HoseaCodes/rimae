// ─── VCTRL AI Abstraction Layer ───────────────────────────────────────────
// Phase 6: Future-ready hooks for LLM-powered features.
// All functions have working fallbacks today; swap in real LLM calls when ready.

// ─── Extractive summary ────────────────────────────────────────────
/**
 * Produces a short summary from raw_text using simple extraction.
 * Takes the first paragraph and truncates at a sentence boundary.
 * No LLM required — works offline and is fast enough for real-time use.
 */
export function extractiveSummary(rawText: string, maxLen = 400): string {
  const trimmed = rawText.trim()
  if (!trimmed) return ''

  // Take first non-empty paragraph (split on 2+ newlines)
  const paraRe = new RegExp(String.fromCharCode(10) + String.fromCharCode(10) + '+')
  const nlRe = new RegExp(String.fromCharCode(10), 'g')
  const firstParagraph = trimmed.split(paraRe).find((p) => p.trim().length > 0) ?? trimmed
  const cleaned = firstParagraph.replace(nlRe, ' ').replace(/\s+/g, ' ').trim()

  if (cleaned.length <= maxLen) return cleaned

  // Truncate at last sentence boundary within maxLen
  const truncated = cleaned.slice(0, maxLen)
  const lastPeriod = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? '),
  )
  if (lastPeriod > maxLen * 0.5) {
    return truncated.slice(0, lastPeriod + 1)
  }
  return truncated.trimEnd() + '…'
}

// ─── AI summary (LLM hook) ──────────────────────────────────────────
/**
 * Generates a summary for an event.
 * Currently uses extractiveSummary as a fallback.
 *
 * To upgrade to an LLM (e.g. Claude Haiku):
 * 1. Add ANTHROPIC_API_KEY to your Supabase secrets
 * 2. Replace the body below with an API call to claude-haiku-4-5-20251001
 */
export async function generateSummary(text: string): Promise<string> {
  // Phase 6 placeholder — returns extractive summary
  return extractiveSummary(text)
}

// ─── Embedding (pgvector hook) ─────────────────────────────────────────
/**
 * Generates a vector embedding for a piece of text.
 * Returns null until an embedding provider is configured.
 *
 * To upgrade (e.g. OpenAI text-embedding-3-small, 1536 dims):
 *   import OpenAI from 'npm:openai'
 *   const openai = new OpenAI()
 *   const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
 *   return res.data[0].embedding
 */
export async function generateEmbedding(_text: string): Promise<number[] | null> {
  // Phase 6 placeholder — returns null (no embedding provider configured)
  return null
}

// ─── Event quality score ───────────────────────────────────────────
/**
 * Simple heuristic score (0-100) indicating how complete an event record is.
 * Used to surface low-quality entries for enrichment.
 */
export function eventQualityScore(event: {
  title: string
  summary: string | null
  raw_text: string
  tag_names?: string[]
  source_name?: string | null
}): number {
  let score = 0
  if (event.title.length >= 10) score += 20
  if (event.summary && event.summary.length >= 50) score += 30
  if (event.raw_text.length >= 100) score += 20
  if (event.tag_names && event.tag_names.length > 0) score += 20
  if (event.source_name) score += 10
  return score
}
