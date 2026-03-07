import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { VCTRL_PROJECT_ID } from '@/lib/constants'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: savedViews } = await supabase
    .from('saved_views')
    .select('id, name')
    .eq('project_id', VCTRL_PROJECT_ID)
    .order('created_at')

  return (
    <AppShell savedViews={savedViews ?? []}>
      {children}
    </AppShell>
  )
}
