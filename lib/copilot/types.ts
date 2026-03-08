// ─── Knowledge Copilot — shared types ────────────────────────────────────────

export type QuestionType =
  | 'issue_summary'
  | 'decision_why'
  | 'blocker_summary'
  | 'briefing_today'
  | 'timeline_summary'
  | 'open_questions'
  | 'current_status'
  | 'general_project_question'

export interface CopilotSource {
  id: string
  type: 'event' | 'follow_up' | 'checklist_item'
  title: string
  subtitle?: string
  href?: string
}

export interface CopilotAnswer {
  answer: string
  sources: CopilotSource[]
  suggestedFollowUps: string[]
  confidence: 'high' | 'medium' | 'low'
  questionType: QuestionType
}

export interface CopilotRequest {
  question: string
  projectId: string
  dateFrom?: string
  dateTo?: string
  scope?: 'project' | 'all'
}
