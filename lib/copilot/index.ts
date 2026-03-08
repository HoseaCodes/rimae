// ─── Knowledge Copilot — main pipeline ───────────────────────────────────────
// Orchestrates: route → retrieve → assemble → synthesize → return answer.
// Server-only. Never import from client components.

import { callProvider } from '@/lib/providers'
import type { AppSettings } from '@/lib/database.types'
import { routeQuestion, getSuggestedFollowUps, getDefaultDateWindow } from './question-routing'
import { retrieveContext, retrieveBriefingContext } from './retrieval'
import { assembleContext } from './context'
import { buildAnswerPrompt, buildBriefingPrompt } from './prompts'
import type { CopilotRequest, CopilotAnswer } from './types'

const MAX_ANSWER_TOKENS = 1024

export async function answerQuestion(
  req: CopilotRequest,
  settings: AppSettings,
  projectName?: string
): Promise<CopilotAnswer> {
  const { question, projectId } = req

  // 1. Route
  const questionType = routeQuestion(question)
  const { dateFrom, dateTo } = getDefaultDateWindow(questionType, req.dateFrom, req.dateTo)

  // 2. Retrieve
  const retrieved = questionType === 'briefing_today'
    ? await retrieveBriefingContext(projectId)
    : await retrieveContext(question, questionType, projectId, { dateFrom, dateTo })

  // 3. Assemble context
  const { contextBlock, sources, confidence } = assembleContext(retrieved)

  // 4. Build prompt
  const prompt = questionType === 'briefing_today'
    ? buildBriefingPrompt(contextBlock, projectName)
    : buildAnswerPrompt(question, contextBlock, questionType, projectName)

  // 5. Synthesize
  let answer: string
  try {
    answer = await callProvider(prompt, settings, MAX_ANSWER_TOKENS)
  } catch (err) {
    throw new Error(`Provider error: ${String(err)}`)
  }

  if (!answer?.trim()) {
    throw new Error('The AI provider returned an empty response.')
  }

  // 6. Return
  return {
    answer: answer.trim(),
    sources,
    confidence,
    questionType,
    suggestedFollowUps: getSuggestedFollowUps(questionType),
  }
}
