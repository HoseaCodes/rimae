'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SaveViewSchema } from '@/lib/schemas'
import { VCTRL_PROJECT_ID } from '@/lib/constants'
import type { ActionResult, SaveViewValues } from '@/lib/schemas'

export async function createSavedViewAction(
  values: SaveViewValues
): Promise<ActionResult<{ viewId: string }>> {
  const parsed = SaveViewSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const data = parsed.data

  const { data: view, error } = await supabase
    .from('saved_views')
    .insert({
      project_id: VCTRL_PROJECT_ID,
      name: data.name,
      description: data.description || null,
      filter_state: data.filter_state,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: `Database error: ${error.message}` }
  }

  revalidatePath('/')
  revalidatePath('/views')

  return { success: true, data: { viewId: (view as { id: string }).id } }
}

export async function deleteSavedViewAction(
  viewId: string
): Promise<ActionResult<undefined>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const { error } = await supabase
    .from('saved_views')
    .delete()
    .eq('id', viewId)

  if (error) {
    return { success: false, error: `Database error: ${error.message}` }
  }

  revalidatePath('/')
  revalidatePath('/views')

  return { success: true, data: undefined }
}
