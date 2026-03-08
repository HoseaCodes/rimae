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

// ─── Follow-up schemas ────────────────────────────────────────────────────

export const FOLLOW_UP_STATUSES = ['backlog','ready','in_progress','in_review','blocked','done'] as const
export const FOLLOW_UP_PRIORITIES = ['low','medium','high','urgent'] as const
export const CHECKLIST_ITEM_STATUSES = ['backlog','in_progress','blocked','done'] as const

export const FollowUpSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  description: z.string().max(2000).optional(),
  assignee: z.string().max(200).optional(),
  priority: z.enum(FOLLOW_UP_PRIORITIES).default('medium'),
  status: z.enum(FOLLOW_UP_STATUSES).default('backlog'),
  due_date: z.string().optional().or(z.literal('')),
  needs_decision: z.boolean().default(false),
})

export type FollowUpValues = z.infer<typeof FollowUpSchema>

export const FollowUpUpdateSchema = FollowUpSchema.omit({ event_id: true }).partial()
export type FollowUpUpdateValues = z.infer<typeof FollowUpUpdateSchema>

export const FollowUpStatusSchema = z.object({
  status: z.enum(FOLLOW_UP_STATUSES),
})

// ─── Checklist schemas ────────────────────────────────────────────────────

export const ChecklistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
})

export type ChecklistValues = z.infer<typeof ChecklistSchema>

export const ChecklistItemSchema = z.object({
  checklist_id: z.string().uuid('Invalid checklist ID'),
  event_id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).optional(),
  owner: z.string().max(200).optional(),
  status: z.enum(CHECKLIST_ITEM_STATUSES).default('backlog'),
  due_date: z.string().optional().or(z.literal('')),
  sort_order: z.number().int().default(0),
})

export type ChecklistItemValues = z.infer<typeof ChecklistItemSchema>

// ─── Action board schemas ─────────────────────────────────────────────────

export const ActionBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  filter_state: z.record(z.string(), z.unknown()).default({}),
  layout_type: z.enum(['list','board','checklist']).default('list'),
})

export type ActionBoardValues = z.infer<typeof ActionBoardSchema>

// ─── Action result types ──────────────────────────────────────────────────

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
