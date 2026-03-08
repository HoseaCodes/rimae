'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveProjectId } from '@/lib/project-context'
import type { AppSettings } from '@/lib/database.types'

// ─── Defaults ────────────────────────────────────────────────────────────────
// ai_enabled is false by default — AI features must be explicitly opted in.

const DEFAULT_SETTINGS: AppSettings = {
  ai_enabled: false,
  ai_provider: 'ollama_local',
  ollama_model: 'llama3',
  ollama_cloud_model: 'llama3.1',
  openai_model: 'gpt-4o-mini',
  claude_model: 'claude-3-5-sonnet-latest',
  temperature: 0.2,
  openai_embedding_model: 'text-embedding-3-small',
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const projectId = await getActiveProjectId()
  const { data } = await supabase
    .from('project_settings')
    .select('settings')
    .eq('project_id', projectId)
    .single()

  if (!data) return { ...DEFAULT_SETTINGS }
  return { ...DEFAULT_SETTINGS, ...(data.settings as Partial<AppSettings>) }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function updateSettingsAction(
  patch: Partial<AppSettings>
): Promise<{ success: boolean; error?: string }> {
  const [current, projectId] = await Promise.all([getSettings(), getActiveProjectId()])
  const merged: AppSettings = { ...current, ...patch }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { error } = await supabase
    .from('project_settings')
    .upsert(
      { project_id: projectId, settings: merged },
      { onConflict: 'project_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings')
  return { success: true }
}
