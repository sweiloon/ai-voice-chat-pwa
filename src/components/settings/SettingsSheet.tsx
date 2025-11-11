import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, EyeOff, Loader2, Save, Settings, UploadCloud, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { listVoices } from '@/lib/tts'
import { useSessionStore } from '@/store/sessions'
import { useSettingsStore, type Provider } from '@/store/settings'
import { useN8NStore } from '@/store/n8n'

const providerOptions: Provider[] = ['mock', 'openai', 'anthropic']

export const SettingsSheet = () => {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai-chat' | 'n8n'>('ai-chat')
  const settings = useSettingsStore()
  const setSettingsValue = useSettingsStore((state) => state.setValue)
  const { exportData, importData } = useSessionStore()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  // N8N settings
  const { settings: n8nSettings, setSettings: setN8NSettings, testConnection } = useN8NStore()
  const [n8nBaseUrl, setN8NBaseUrl] = useState(n8nSettings.baseUrl || '')
  const [n8nApiKey, setN8NApiKey] = useState(n8nSettings.apiKey || '')
  const [showN8NApiKey, setShowN8NApiKey] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const loadVoices = () => setVoices(listVoices())
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const handleExport = async () => {
    const snapshot = await exportData()
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resonance-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export complete. Keep the JSON safe.')
  }

  const voiceOptions = useMemo(() => voices.map((voice) => voice.name), [voices])

  const handleN8NTest = async () => {
    if (!n8nBaseUrl || !n8nApiKey) {
      toast.error('Please enter both N8N URL and API key')
      return
    }

    setN8NSettings({ baseUrl: n8nBaseUrl, apiKey: n8nApiKey })
    setTestingConnection(true)

    try {
      const connected = await testConnection()
      if (connected) {
        toast.success('N8N connection successful!')
      } else {
        toast.error('N8N connection failed. Check browser console (F12) for details.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Connection failed: ${errorMessage}`)
      console.error('N8N test error:', error)
    } finally {
      setTestingConnection(false)
    }
  }

  const handleN8NSave = () => {
    setN8NSettings({ baseUrl: n8nBaseUrl, apiKey: n8nApiKey })
    toast.success('N8N settings saved')
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm"
        >
          <Settings size={16} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed bottom-0 left-1/2 z-50 h-[85vh] w-full max-w-lg -translate-x-1/2 rounded-t-3xl bg-card p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Settings</Dialog.Title>
            <Dialog.Close className="rounded-full border border-border p-2 text-sm">Close</Dialog.Close>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('ai-chat')}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === 'ai-chat'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              AI Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('n8n')}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === 'n8n'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              N8N
            </button>
          </div>

          <div className="space-y-6 overflow-y-auto pr-2">{activeTab === 'ai-chat' ? (
            <>
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Provider</p>
              <div className="grid grid-cols-3 gap-2">
                {providerOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                      settings.provider === option ? 'border-primary text-primary' : 'border-border text-muted-foreground'
                    }`}
                    onClick={() => setSettingsValue('provider', option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {settings.provider !== 'mock' && (
                <div className="mt-3 space-y-3">
                  <label className="flex flex-col text-sm">
                    <span className="mb-1 text-muted-foreground">OpenAI key</span>
                    <input
                      type="password"
                      value={settings.openaiKey ?? ''}
                      onChange={(event) => setSettingsValue('openaiKey', event.target.value)}
                      className="rounded-lg border border-border bg-transparent px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="mb-1 text-muted-foreground">Anthropic key</span>
                    <input
                      type="password"
                      value={settings.anthropicKey ?? ''}
                      onChange={(event) => setSettingsValue('anthropicKey', event.target.value)}
                      className="rounded-lg border border-border bg-transparent px-3 py-2"
                    />
                  </label>
                </div>
              )}
            </section>
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Speech</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col text-sm">
                  <span className="mb-1">STT language</span>
                  <input
                    type="text"
                    value={settings.sttLang}
                    onChange={(event) => setSettingsValue('sttLang', event.target.value)}
                    className="rounded-lg border border-border bg-transparent px-3 py-2"
                  />
                </label>
                <label className="flex flex-col text-sm">
                  <span className="mb-1">TTS rate</span>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={settings.ttsRate}
                    onChange={(event) => setSettingsValue('ttsRate', Number(event.target.value))}
                  />
                  <span className="text-xs text-muted-foreground">{settings.ttsRate.toFixed(1)}x</span>
                </label>
              </div>
              <label className="mt-3 flex flex-col text-sm">
                <span className="mb-1">TTS voice</span>
                <select
                  value={settings.ttsVoice ?? ''}
                  onChange={(event) => setSettingsValue('ttsVoice', event.target.value)}
                  className="rounded-lg border border-border bg-transparent px-3 py-2"
                >
                  <option value="">System default</option>
                  {voiceOptions.map((voice) => (
                    <option key={voice} value={voice}>
                      {voice}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.playAssistantAudio}
                  onChange={(event) => setSettingsValue('playAssistantAudio', event.target.checked)}
                />
                Auto play assistant replies
              </label>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Data control</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <UploadCloud size={16} /> Export JSON
                </button>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <Save size={16} />
                  Import JSON
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      const text = await file.text()
                      try {
                        const payload = JSON.parse(text)
                        await importData(payload)
                        toast.success('Import successful')
                      } catch (error) {
                        toast.error('Invalid JSON snapshot')
                        console.error(error)
                      }
                    }}
                  />
                </label>
              </div>
            </section>
            </>
          ) : (
            <>
            {/* N8N Tab Content */}
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Connection</p>
              <div className="space-y-3">
                <label className="flex flex-col text-sm">
                  <span className="mb-1 flex items-center gap-2">
                    N8N Instance URL
                    {n8nSettings.connected && <CheckCircle2 size={14} className="text-green-500" />}
                    {n8nSettings.baseUrl && !n8nSettings.connected && <XCircle size={14} className="text-destructive" />}
                  </span>
                  <input
                    type="url"
                    value={n8nBaseUrl}
                    onChange={(event) => setN8NBaseUrl(event.target.value)}
                    placeholder="https://n8n.example.com"
                    className="rounded-lg border border-border bg-transparent px-3 py-2"
                  />
                </label>
                <label className="flex flex-col text-sm">
                  <span className="mb-1">API Key</span>
                  <div className="relative">
                    <input
                      type={showN8NApiKey ? 'text' : 'password'}
                      value={n8nApiKey}
                      onChange={(event) => setN8NApiKey(event.target.value)}
                      placeholder="Enter your N8N API key"
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowN8NApiKey(!showN8NApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    >
                      {showN8NApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleN8NTest}
                    disabled={testingConnection || !n8nBaseUrl || !n8nApiKey}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {testingConnection ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Testing...
                      </span>
                    ) : (
                      'Test Connection'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleN8NSave}
                    disabled={!n8nBaseUrl || !n8nApiKey}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">About</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Connect your N8N instance to trigger workflows via voice or text chat.</p>
                <p className="text-xs">
                  <strong>Note:</strong> Due to browser security (CORS), you may need to configure your N8N instance to allow requests from this domain.
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                  <p className="mb-2 font-semibold text-foreground">CORS Configuration:</p>
                  <p className="mb-1">Add to your N8N environment variables:</p>
                  <code className="block rounded bg-background p-2 font-mono">
                    N8N_CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
                  </code>
                </div>
              </div>
            </section>
            </>
          )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
