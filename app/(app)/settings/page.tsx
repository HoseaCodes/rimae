import type { Metadata } from 'next'
import { Settings } from 'lucide-react'
import { getSettings } from '@/lib/actions/settings'
import { getProviderEnvWarning } from '@/lib/ai'
import { SettingsForm } from '@/components/settings/SettingsForm'

export const metadata: Metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await getSettings()
  // Compute env warning server-side so process.env stays off the client
  const envWarning = getProviderEnvWarning(settings.ai_provider)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-6">
      <div className="flex items-center gap-2">
        <Settings size={15} className="text-muted-foreground" />
        <h1 className="text-base font-semibold text-foreground">Settings</h1>
        <span className="text-xs text-muted-foreground">— AI provider &amp; intelligence config</span>
      </div>

      <SettingsForm initial={settings} envWarning={envWarning} />
    </div>
  )
}
