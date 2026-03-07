import { z } from 'zod'

// ─── Event form schema ─────────────────────────────────────────────────────

export const EventFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  summary: z.string().max(2000, 'Summary is too long').optional(),
  raw_text: z.string().min(1, 'Content is required'),
  event_type: z.enum([
    'decision', 'bug_note', 'feedback', 'insight',
    'blocker', 'update', 'reference', 'log',
  ]),
  category: z.enum([
    'product_decision', 'bug', 'auth_oauth', 'launch_blocker',
    'beta_feedback', 'competitor_insight', 'pricing', 'roadmap',
    'app_store', 'marketing', 'chat_log', 'general',
  ]),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  status: z.enum(['open', 'in_progress', 'resolved', 'archived', 'wont_fix']),
  event_timestamp: z.string().min(1, 'Date is required'),
  tags_raw: z.string().optional(),
  // Source fields (create only — not shown on edit)
  source_name: z.string().max(200).optional(),
  source_type: z.enum([
    'chatgpt_web', 'claude_web', 'manual', 'notion', 'slack',
    'email', 'document', 'screenshot', 'external_url', 'other',
  ]).optional(),
  source_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
})

export type EventFormValues = z.infer<typeof EventFormSchema>

// ─── Saved view schema ────────────────────────────────────────────────────

export const SaveViewSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500).optional(),
  filter_state: z.record(z.string(), z.unknown()),
})

export type SaveViewValues = z.infer<typeof SaveViewSchema>

// ─── Action result types ──────────────────────────────────────────────────

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
