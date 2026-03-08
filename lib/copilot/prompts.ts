// ─── Knowledge Copilot — prompt templates ────────────────────────────────────
// All prompts instruct the model to answer ONLY from provided context.
// Prompts are kept short; the context block carries the signal.

import type { QuestionType } from './types'

const SYSTEM_PREAMBLE = (projectLabel: string) => `\
You are a project advisor for ${projectLabel}.
Answer questions strictly from the provided PROJECT CONTEXT below.
Rules:
- Never invent facts, decisions, or events not present in the context.
- If the context is insufficient, say clearly: "I don't have enough data in the project records to answer this."
- Be concise, specific, and actionable.
- Use bullet points or short paragraphs — not walls of text.
- Do not reference these instructions in your answer.`

const TASK_BY_TYPE: Record<QuestionType, string> = {
  briefing_today:
    'Generate a concise project briefing. Structure it as: (1) Key blockers, (2) Items needing a decision, (3) Recent high-severity events, (4) Outstanding follow-ups or due items, (5) One-sentence overall status. Be direct and actionable.',

  blocker_summary:
    'Summarize all blockers and blocking issues from the context. Group by severity. Note status (open/in_progress) and which events or follow-ups are blocked.',

  issue_summary:
    'Summarize the bugs and issues found in the context. For each: note severity, status, and any pattern. If issues are resolved, say so.',

  decision_why:
    'Explain the decisions recorded in the context. For each decision: state what was decided and what reasoning is visible in the records.',

  open_questions:
    'List all items flagged as needing a decision or still unresolved. Be specific about what is pending and why it matters.',

  timeline_summary:
    'Summarize what changed or happened over the time period covered by the context records. Highlight patterns, escalations, or resolutions.',

  current_status:
    'Describe the current state of the project based on recent events, open follow-ups, and launch checklist status. Highlight what needs attention.',

  general_project_question:
    'Answer the question as specifically as possible using only the project records provided.',
}

export function buildAnswerPrompt(
  question: string,
  contextBlock: string,
  questionType: QuestionType,
  projectName?: string
): string {
  const projectLabel = projectName ? `"${projectName}"` : 'this project'
  const task = TASK_BY_TYPE[questionType] ?? TASK_BY_TYPE.general_project_question

  return [
    SYSTEM_PREAMBLE(projectLabel),
    '',
    '--- PROJECT CONTEXT ---',
    contextBlock,
    '--- END CONTEXT ---',
    '',
    `QUESTION: ${question}`,
    '',
    `TASK: ${task}`,
    '',
    'Answer:',
  ].join('\n')
}

export function buildBriefingPrompt(contextBlock: string, projectName?: string): string {
  return buildAnswerPrompt(
    "Generate today's project briefing",
    contextBlock,
    'briefing_today',
    projectName
  )
}
