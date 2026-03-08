'use server'

// ─── Knowledge Copilot — server action ───────────────────────────────────────
// Entry point for the Copilot Q&A pipeline from client components.
// Enforces: AI opt-in, provider env checks, input validation, error safety.

import { getSettings } from '@/lib/actions/settings'
import { getActiveProjectId, getActiveProject } from '@/lib/project-context'
import { isAIEnabled, getProviderEnvWarning } from '@/lib/ai'
import { answerQuestion } from '@/lib/copilot/index'
import type { CopilotRequest, CopilotAnswer } from '@/lib/copilot/types'
import type { ActionResult } from '@/lib/schemas'

export type CopilotActionResult = ActionResult<CopilotAnswer>

export async function askCopilotAction(
  question: string,
  opts?: { dateFrom?: string; dateTo?: string; scope?: 'project' | 'all' }
): Promise<CopilotActionResult> {
  // ── Input validation ──────────────────────────────────────────────────────
  const trimmed = question?.trim()
  if (!trimmed) {
    return { success: false, error: 'Please enter a question.' }
  }
  if (trimmed.length > 1000) {
    return { success: false, error: 'Question is too long. Please keep it under 1000 characters.' }
  }

  // ── AI guard ─────────────────────────────────────────────────────────────
  const settings = await getSettings()
  if (!isAIEnabled(settings)) {
    return {
      success: false,
      error: 'Knowledge Copilot requires AI to be enabled. Go to Settings to turn it on.',
    }
  }

  // ── Provider env check ────────────────────────────────────────────────────
  const envWarning = getProviderEnvWarning(settings.ai_provider)
  if (envWarning) {
    return { success: false, error: envWarning }
  }

  // ── Resolve project ───────────────────────────────────────────────────────
  const [projectId, activeProject] = await Promise.all([
    getActiveProjectId(),
    getActiveProject(),
  ])

  const req: CopilotRequest = {
    question: trimmed,
    projectId,
    dateFrom: opts?.dateFrom,
    dateTo: opts?.dateTo,
    scope: opts?.scope ?? 'project',
  }

  // ── Run pipeline ──────────────────────────────────────────────────────────
  try {
    const answer = await answerQuestion(req, settings, activeProject?.name)
    return { success: true, data: answer }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
