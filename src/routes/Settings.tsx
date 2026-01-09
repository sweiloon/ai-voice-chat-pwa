
import { 
  Loader2, 
  Save, 
  UploadCloud, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Bot, 
  Database, 
  Mic,
  Volume2,
  Globe
} from 'lucide-react'

import { useSettingsStore, type Provider } from '@/store/settings'
import { useVoiceSettings } from '@/hooks/useVoiceSettings'
import { useDataControl } from '@/hooks/useDataControl'
import { useN8NConnection } from '@/hooks/useN8NConnection'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { cn } from '@/lib/utils'

const providerOptions: Provider[] = ['mock', 'openai', 'anthropic']

export const Settings = () => {
  const settings = useSettingsStore()
  const setSettingsValue = useSettingsStore((state) => state.setValue)

  // Custom hooks
  const { voiceOptions } = useVoiceSettings()
  const { handleExport, handleImport } = useDataControl()
  const {
    n8nSettings,
    instanceType,
    setInstanceType,
    n8nBaseUrl,
    setN8NBaseUrl,
    n8nApiKey,
    setN8NApiKey,
    showN8NApiKey,
    setShowN8NApiKey,
    testingConnection,
    handleN8NTest,
    handleN8NSave
  } = useN8NConnection()

  const SettingsSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">{title}</h3>
      <div className="bg-card border rounded-xl overflow-hidden divide-y">
        {children}
      </div>
    </div>
  )

  const SettingsRow = ({ 
    icon: Icon, 
    label, 
    children, 
    className 
  }: { 
    icon?: React.ElementType, 
    label: string, 
    children: React.ReactNode,
    className?: string 
  }) => (
    <div className={cn("flex items-center justify-between p-4 bg-card", className)}>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={20} className="text-muted-foreground" />}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  )

  return (
    <div className="flex h-full flex-col bg-secondary/30">
      {/* Header */}
      <header className="flex items-center px-6 h-16 bg-background border-b sticky top-0 z-10">
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-6">
          
          {/* AI Settings */}
          <SettingsSection title="AI Configuration">
            <SettingsRow icon={Bot} label="Provider">
              <div className="flex bg-secondary/50 rounded-lg p-1">
                {providerOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSettingsValue('provider', option)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md capitalize transition-all",
                      settings.provider === option 
                        ? "bg-background shadow-sm text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </SettingsRow>

            {settings.provider !== 'mock' && (
              <div className="p-4 space-y-4 bg-card">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">OpenAI Key</label>
                  <Input
                    type="password"
                    value={settings.openaiKey ?? ''}
                    onChange={(e) => setSettingsValue('openaiKey', e.target.value)}
                    placeholder="sk-..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Anthropic Key</label>
                  <Input
                    type="password"
                    value={settings.anthropicKey ?? ''}
                    onChange={(e) => setSettingsValue('anthropicKey', e.target.value)}
                    placeholder="sk-ant-..."
                  />
                </div>
              </div>
            )}
          </SettingsSection>

          {/* Voice Settings */}
          <SettingsSection title="Voice & Speech">
            <SettingsRow icon={Globe} label="STT Language">
              <Input
                value={settings.sttLang}
                onChange={(e) => setSettingsValue('sttLang', e.target.value)}
                className="w-32 h-8 text-xs"
              />
            </SettingsRow>
            
            <SettingsRow icon={Volume2} label="TTS Voice">
              <select
                value={settings.ttsVoice ?? ''}
                onChange={(e) => setSettingsValue('ttsVoice', e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">System Default</option>
                {voiceOptions.map((voice) => (
                  <option key={voice} value={voice}>{voice}</option>
                ))}
              </select>
            </SettingsRow>

            <SettingsRow icon={Mic} label="Auto-play Responses">
              <input
                type="checkbox"
                checked={settings.playAssistantAudio}
                onChange={(e) => setSettingsValue('playAssistantAudio', e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </SettingsRow>
          </SettingsSection>

          {/* N8N Settings */}
          <SettingsSection title="N8N Integration">
            <SettingsRow icon={Database} label="Instance Type">
              <div className="flex bg-secondary/50 rounded-lg p-1">
                <button
                  onClick={() => setInstanceType('cloud')}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    instanceType === 'cloud' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Cloud
                </button>
                <button
                  onClick={() => setInstanceType('self-hosted')}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    instanceType === 'self-hosted' 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Self-Hosted
                </button>
              </div>
            </SettingsRow>

            <div className="p-4 space-y-4 bg-card border-t">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  Instance URL
                  {n8nSettings.connected && <CheckCircle2 size={12} className="text-green-500" />}
                </label>
                <Input
                  value={n8nBaseUrl}
                  onChange={(e) => setN8NBaseUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">API Key</label>
                <div className="relative">
                  <Input
                    type={showN8NApiKey ? 'text' : 'password'}
                    value={n8nApiKey}
                    onChange={(e) => setN8NApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    onClick={() => setShowN8NApiKey(!showN8NApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showN8NApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleN8NTest}
                  disabled={testingConnection || !n8nBaseUrl || !n8nApiKey}
                >
                  {testingConnection ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                  Test Connection
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleN8NSave}
                  disabled={!n8nBaseUrl || !n8nApiKey}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </SettingsSection>

          {/* Data Management */}
          <SettingsSection title="Data Management">
            <div className="p-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleExport}>
                <UploadCloud size={16} className="mr-2" />
                Export Data
              </Button>
              <div className="relative flex-1">
                <Button variant="outline" className="w-full">
                  <Save size={16} className="mr-2" />
                  Import Data
                </Button>
                <input
                  type="file"
                  accept="application/json"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) await handleImport(file)
                  }}
                />
              </div>
            </div>
          </SettingsSection>

          <div className="text-center text-xs text-muted-foreground mt-8 mb-4">
            Resonance v1.0.0 • Built with ❤️
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
