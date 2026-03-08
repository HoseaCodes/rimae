'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_PROJECT_COOKIE } from '@/lib/project-context'
import type { ActionResult } from '@/lib/schemas'

// ─── Project switching ────────────────────────────────────────────────────────

/**
 * Stores the chosen project ID in a long-lived cookie and reloads the root.
 * All project-scoped pages read this cookie via getActiveProjectId().
 */
export async function switchProjectAction(projectId: string): Promise<void> {
  if (!projectId) return
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_PROJECT_COOKIE, projectId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
  redirect('/')
}

// ─── Project creation ─────────────────────────────────────────────────────────

export async function createProjectAction(values: {
  name: string
  slug: string
  description?: string
}): Promise<ActionResult<{ projectId: string }>> {
  if (!values.name?.trim()) return { success: false, error: 'Name is required' }
  if (!values.slug?.trim()) return { success: false, error: 'Slug is required' }
  if (!/^[a-z0-9-]+$/.test(values.slug.trim())) {
    return { success: false, error: 'Slug must be lowercase letters, numbers, and hyphens only' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: values.description?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  // Seed default project settings (AI off by default)
  await supabase.from('project_settings').insert({
    project_id: (data as { id: string }).id,
    settings: {
      ai_enabled: false,
      ai_provider: 'ollama_local',
      ollama_model: 'llama3',
      ollama_cloud_model: '',
      openai_model: 'gpt-4o-mini',
      claude_model: 'claude-3-haiku-20240307',
      temperature: 0.3,
      openai_embedding_model: 'text-embedding-3-small',
    },
  })

  revalidatePath('/projects')
  return { success: true, data: { projectId: (data as { id: string }).id } }
}
