/**
 * lib/project-context.ts
 *
 * Server-side active project resolution.
 * Reads the active project from a cookie (set by switchProjectAction).
 * Falls back to the original RIMAE project if no cookie is present,
 * preserving full backwards compatibility.
 *
 * Safe to call from:
 *   - Server components (Next.js App Router)
 *   - Server actions ('use server')
 *   - Route handlers
 */

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { RIMAE_PROJECT_ID } from '@/lib/constants'
import type { Project } from '@/lib/database.types'

export const ACTIVE_PROJECT_COOKIE = 'rimae_active_project'

/**
 * Returns the active project ID from the session cookie.
 * Falls back to RIMAE_PROJECT_ID if no cookie is set.
 */
export async function getActiveProjectId(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get(ACTIVE_PROJECT_COOKIE)?.value ?? RIMAE_PROJECT_ID
}

/**
 * Returns the full Project row for the active project.
 * Returns null if the project ID in the cookie no longer exists.
 */
export async function getActiveProject(): Promise<Project | null> {
  const projectId = await getActiveProjectId()
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  return data as Project | null
}
