// ─── AI Provider Dispatch ────────────────────────────────────────────────────
// Server-only. Never import from client components.
// Dispatches text-completion calls and embedding generation to configured providers.

import type { AppSettings } from '@/lib/database.types'

/**
 * Send a prompt to the active provider and return the text response.
 * Throws on network / auth failure — callers should catch and return ActionResult errors.
 */
export async function callProvider(
  prompt: string,
  settings: AppSettings,
  maxTokens = 512
): Promise<string> {
  switch (settings.ai_provider) {
    case 'claude':       return callClaude(prompt, settings, maxTokens)
    case 'openai':       return callOpenAI(prompt, settings, maxTokens)
    case 'ollama_local': return callOllama(prompt, settings)
    default:             throw new Error(`Unknown provider: ${settings.ai_provider}`)
  }
}

// ─── Claude ───────────────────────────────────────────────────────────────────

async function callClaude(
  prompt: string,
  settings: AppSettings,
  maxTokens: number
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set.')
  }
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const msg = await client.messages.create({
    model: settings.claude_model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = msg.content[0]
  return block.type === 'text' ? block.text.trim() : ''
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(
  prompt: string,
  settings: AppSettings,
  maxTokens: number
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set.')
  }
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const res = await client.chat.completions.create({
    model: settings.openai_model,
    temperature: settings.temperature,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })

  return res.choices[0]?.message?.content?.trim() ?? ''
}

// ─── Ollama (local) ───────────────────────────────────────────────────────────

async function callOllama(prompt: string, settings: AppSettings): Promise<string> {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: settings.ollama_model, prompt, stream: false }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${res.statusText}. Is Ollama running locally?`)
  }

  const json = (await res.json()) as { response: string }
  return json.response.trim()
}

// ─── Embeddings (OpenAI only, 1536 dims) ─────────────────────────────────────
// Embeddings are always generated via OpenAI text-embedding models regardless
// of which completion provider is selected, because the pgvector column is
// fixed at 1536 dimensions (text-embedding-3-small / text-embedding-ada-002).

export async function generateEmbeddingVector(
  text: string,
  settings: AppSettings
): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for embedding generation.')
  }

  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const res = await client.embeddings.create({
    model: settings.openai_embedding_model,
    input: text.slice(0, 8000), // model context limit safety
  })

  return res.data[0].embedding
}
