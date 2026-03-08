// ─── Knowledge Copilot — question routing ────────────────────────────────────
// Lightweight heuristic classifier. Maps a question to a retrieval strategy.

import type { QuestionType } from './types'

/** Suggested follow-up questions for each question type. */
const FOLLOW_UPS: Record<QuestionType, string[]> = {
  briefing_today: [
    'What are the current launch blockers?',
    'Which follow-ups need a decision?',
    'What changed in the last 7 days?',
  ],
  blocker_summary: [
    'Generate a briefing for today',
    'What is the current launch status?',
    'Which issues are resolved vs open?',
  ],
  issue_summary: [
    'Which bugs are still open?',
    'What are the auth issues?',
    'What were the launch blockers last month?',
  ],
  decision_why: [
    'Summarize all product decisions',
    'What decisions still need to be made?',
    'What changed in roadmap recently?',
  ],
  open_questions: [
    'Generate a briefing for today',
    'What blockers need to be resolved?',
    'What decisions were made recently?',
  ],
  timeline_summary: [
    'What are the current open items?',
    'What decisions were made this month?',
    'Generate a briefing for today',
  ],
  current_status: [
    'Generate a briefing for today',
    'What are the main blockers?',
    'What needs a decision?',
  ],
  general_project_question: [
    'Summarize all launch blockers',
    'What were the main auth issues?',
    'Generate a briefing for today',
  ],
}

export function routeQuestion(question: string): QuestionType {
  const q = question.toLowerCase()

  if (/\b(briefing|today['\u2019]?s|this morning|what matters today|daily update|start of day)\b/.test(q)) {
    return 'briefing_today'
  }
  if (/\b(block(er|ers|ed|ing)|launch blocker)\b/.test(q)) {
    return 'blocker_summary'
  }
  if (/\b(bug|bugs|issue|issues|error|errors|broken|problem|problems|crash|failing|failed)\b/.test(q)) {
    return 'issue_summary'
  }
  if (/\b(why|decision|chose|choose|reason|rationale|decided|picking|picked|chose)\b/.test(q)) {
    return 'decision_why'
  }
  if (/\b(needs? decision|pending|unresolved|open question|outstanding|waiting on)\b/.test(q)) {
    return 'open_questions'
  }
  if (/\b(last week|last month|this week|recent|since|history|timeline|changed|over time|what happened)\b/.test(q)) {
    return 'timeline_summary'
  }
  if (/\b(status|current state|where are we|progress|how is|how are|state of)\b/.test(q)) {
    return 'current_status'
  }
  return 'general_project_question'
}

export function getSuggestedFollowUps(questionType: QuestionType): string[] {
  return FOLLOW_UPS[questionType] ?? FOLLOW_UPS.general_project_question
}

/**
 * Derive a default date window based on question type.
 * Returns { dateFrom, dateTo } in ISO format, or undefined for no restriction.
 */
export function getDefaultDateWindow(
  questionType: QuestionType,
  dateFrom?: string,
  dateTo?: string
): { dateFrom?: string; dateTo?: string } {
  // Caller-supplied values always win
  if (dateFrom || dateTo) return { dateFrom, dateTo }

  const now = new Date()
  switch (questionType) {
    case 'briefing_today': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return { dateFrom: d.toISOString() }
    }
    case 'timeline_summary': {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      return { dateFrom: d.toISOString() }
    }
    default:
      return {}
  }
}
