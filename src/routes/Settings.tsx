import { useState } from 'react'
import { Loader2, Save, UploadCloud, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useSettingsStore, type Provider } from '@/store/settings'
import { useVoiceSettings } from '@/hooks/useVoiceSettings'
import { useDataControl } from '@/hooks/useDataControl'
import { useN8NConnection } from '@/hooks/useN8NConnection'

const providerOptions: Provider[] = ['mock', 'openai', 'anthropic']

/**
 * Settings Page - Full page settings view (not a dialog)
 *
 * Features:
 * - Two tabs: AI Chat and N8N
 * - Responsive layout
 * - Back navigation
 * - All settings from previous SettingsSheet
 */
export const Settings = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'ai-chat' | 'n8n' | 'profile'>('ai-chat')
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
    useProxy,
    setUseProxy,
    showN8NApiKey,
    setShowN8NApiKey,
    testingConnection,
    handleN8NTest,
    handleN8NSave
  } = useN8NConnection()

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex h-12 md:h-14 items-center px-3 md:px-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-2 md:mr-3 flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg transition-all hover:bg-secondary active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="md:w-5 md:h-5" />
          </button>
          <h1 className="text-base md:text-lg font-bold text-foreground">
            Settings
          </h1>
        </div>
      </header>

      {/* Fixed Tabs */}
      <div className="fixed top-[48px] md:top-[56px] left-0 right-0 z-30 border-b border-border/50 bg-card/80 backdrop-blur-sm px-3 md:px-4">
        <div className="flex gap-0.5 md:gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('ai-chat')}
            className={`px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-all rounded-t-lg relative ${
              activeTab === 'ai-chat'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
            }`}
          >
            AI Chat
            {activeTab === 'ai-chat' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('n8n')}
            className={`px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-all rounded-t-lg relative ${
              activeTab === 'n8n'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
            }`}
          >
            N8N
            {activeTab === 'n8n' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-all rounded-t-lg relative ${
              activeTab === 'profile'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
            }`}
          >
            Profile
            {activeTab === 'profile' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Content with padding for fixed header, tabs, and navbar */}
      <div className="flex-1 overflow-y-auto pt-[96px] md:pt-[112px] pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl px-4 md:px-6 py-6 space-y-6">
          {activeTab === 'profile' ? (
            <>
              {/* Profile Tab Content */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Account
                </p>
                <div className="text-sm text-muted-foreground text-center py-12">
                  <p>Profile settings will be available soon.</p>
                  <p className="mt-2">Manage your account, preferences, and more.</p>
                </div>
              </section>
            </>
          ) : activeTab === 'ai-chat' ? (
            <>
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Provider
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {providerOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition hover:bg-accent ${
                        settings.provider === option
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground'
                      }`}
                      onClick={() => setSettingsValue('provider', option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {settings.provider !== 'mock' && (
                  <div className="mt-4 space-y-3">
                    <label className="flex flex-col text-sm">
                      <span className="mb-2 text-muted-foreground">OpenAI key</span>
                      <input
                        type="password"
                        value={settings.openaiKey ?? ''}
                        onChange={(event) => setSettingsValue('openaiKey', event.target.value)}
                        className="rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                    <label className="flex flex-col text-sm">
                      <span className="mb-2 text-muted-foreground">Anthropic key</span>
                      <input
                        type="password"
                        value={settings.anthropicKey ?? ''}
                        onChange={(event) => setSettingsValue('anthropicKey', event.target.value)}
                        className="rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                  </div>
                )}
              </section>

              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Speech
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col text-sm">
                    <span className="mb-2">STT language</span>
                    <input
                      type="text"
                      value={settings.sttLang}
                      onChange={(event) => setSettingsValue('sttLang', event.target.value)}
                      className="rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="mb-2">TTS rate</span>
                    <input
                      type="range"
                      min={0.5}
                      max={1.5}
                      step={0.1}
                      value={settings.ttsRate}
                      onChange={(event) => setSettingsValue('ttsRate', Number(event.target.value))}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{settings.ttsRate.toFixed(1)}x</span>
                  </label>
                </div>
                <label className="mt-4 flex flex-col text-sm">
                  <span className="mb-2">TTS voice</span>
                  <select
                    value={settings.ttsVoice ?? ''}
                    onChange={(event) => setSettingsValue('ttsVoice', event.target.value)}
                    className="rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">System default</option>
                    {voiceOptions.map((voice) => (
                      <option key={voice} value={voice}>
                        {voice}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.playAssistantAudio}
                    onChange={(event) => setSettingsValue('playAssistantAudio', event.target.checked)}
                    className="h-4 w-4"
                  />
                  Auto play assistant replies
                </label>
              </section>

              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Data control
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
                  >
                    <UploadCloud size={16} /> Export JSON
                  </button>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-accent">
                    <Save size={16} />
                    Import JSON
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        await handleImport(file)
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
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Instance Type
                </p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <button
                    type="button"
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition hover:bg-accent ${
                      instanceType === 'cloud'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                    onClick={() => setInstanceType('cloud')}
                  >
                    N8N Cloud
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition hover:bg-accent ${
                      instanceType === 'self-hosted'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                    onClick={() => setInstanceType('self-hosted')}
                  >
                    Self-Hosted
                  </button>
                </div>
              </section>

              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Connection
                </p>
                <div className="space-y-4">
                  <label className="flex flex-col text-sm">
                    <span className="mb-2 flex items-center gap-2">
                      N8N Instance URL
                      {n8nSettings.connected && <CheckCircle2 size={14} className="text-green-500" />}
                      {n8nSettings.baseUrl && !n8nSettings.connected && (
                        <span className="text-xs text-destructive">(Not connected)</span>
                      )}
                    </span>
                    <input
                      type="url"
                      value={n8nBaseUrl}
                      onChange={(event) => setN8NBaseUrl(event.target.value)}
                      placeholder={
                        instanceType === 'cloud'
                          ? 'https://yourworkspace.app.n8n.cloud'
                          : 'http://localhost:5678 or https://n8n.yourdomain.com'
                      }
                      className="rounded-lg border border-border bg-transparent px-3 py-2.5 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    <span className="mb-2">API Key</span>
                    <div className="relative">
                      <input
                        type={showN8NApiKey ? 'text' : 'password'}
                        value={n8nApiKey}
                        onChange={(event) => setN8NApiKey(event.target.value)}
                        placeholder="Enter your N8N API key"
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 pr-10 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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

                  {/* Show proxy option only for self-hosted */}
                  {instanceType === 'self-hosted' && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useProxy}
                        onChange={(event) => setUseProxy(event.target.checked)}
                        className="h-4 w-4"
                      />
                      <span>Use proxy server (enable if you have CORS issues)</span>
                    </label>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleN8NTest}
                      disabled={testingConnection || !n8nBaseUrl || !n8nApiKey}
                      className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </section>

              {/* Setup Guide Section */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Setup Guide
                </p>
                {instanceType === 'cloud' ? (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Connect your N8N Cloud instance to trigger workflows via voice or text chat.</p>
                    <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs space-y-3">
                      <div>
                        <p className="mb-2 font-semibold text-foreground">1. Get your N8N Cloud URL:</p>
                        <p className="mb-2">Go to your N8N Cloud workspace. Your URL will look like:</p>
                        <code className="block rounded bg-background p-2 font-mono">
                          https://yourworkspace.app.n8n.cloud
                        </code>
                      </div>
                      <div>
                        <p className="mb-2 font-semibold text-foreground">2. Get your API key:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Open N8N Cloud and go to Settings → API</li>
                          <li>Click "Create API Key"</li>
                          <li>Give it a name (e.g., "Voice Chat App")</li>
                          <li>Copy the generated API key</li>
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 font-semibold text-foreground">3. Connection:</p>
                        <p>N8N Cloud requires a proxy to bypass CORS. The app automatically uses the proxy for Cloud instances.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Connect your self-hosted N8N instance to trigger workflows.</p>
                    <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs space-y-3">
                      <div>
                        <p className="mb-2 font-semibold text-foreground">1. Get your N8N URL:</p>
                        <p className="mb-2">Your N8N URL depends on your setup:</p>
                        <code className="block rounded bg-background p-2 font-mono mb-2">
                          http://localhost:5678 (local development)
                        </code>
                        <code className="block rounded bg-background p-2 font-mono">
                          https://n8n.yourdomain.com (production)
                        </code>
                      </div>
                      <div>
                        <p className="mb-2 font-semibold text-foreground">2. Get your API key:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Open your N8N instance and go to Settings → API</li>
                          <li>Click "Create API Key"</li>
                          <li>Give it a name (e.g., "Voice Chat App")</li>
                          <li>Copy the generated API key</li>
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 font-semibold text-foreground">3. Configure CORS (Direct Connection):</p>
                        <p className="mb-2">If you want to connect directly without proxy, configure CORS in your N8N instance:</p>
                        <code className="block rounded bg-background p-2 font-mono mb-2">
                          N8N_CORS_ORIGIN=*
                        </code>
                        <p className="text-muted-foreground">
                          Or restrict to your domain: N8N_CORS_ORIGIN=https://yourdomain.com
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 font-semibold text-foreground">4. Use Proxy (if you have CORS issues):</p>
                        <p className="mb-2">
                          If you don't want to configure CORS, enable the "Use proxy server" option above. The proxy will handle CORS for you.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Workflow Webhook Setup Guide */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Workflow Webhook Setup
                </p>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Configure your N8N workflow to receive messages from this app.</p>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs space-y-4">
                    <div>
                      <p className="mb-2 font-semibold text-foreground">Step 1: Create or Open Workflow</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Go to your N8N instance and create a new workflow</li>
                        <li>Or open an existing workflow you want to connect</li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 font-semibold text-foreground">Step 2: Add Webhook Node (First Node)</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Click the "+" button to add a new node</li>
                        <li>Search for "Webhook" and select the "Webhook" trigger node</li>
                        <li><strong>Important:</strong> The Webhook must be the FIRST node in your workflow</li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 font-semibold text-foreground">Step 3: Configure Webhook Node</p>
                      <div className="space-y-2 ml-2">
                        <p className="font-medium text-foreground">Required Settings:</p>
                        <div className="bg-background rounded p-3 space-y-2">
                          <div>
                            <p className="font-medium text-foreground">• HTTP Method:</p>
                            <code className="ml-2 text-primary">POST</code>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">• Path:</p>
                            <code className="ml-2 text-primary">Leave auto-generated or set custom path</code>
                            <p className="ml-2 mt-1 text-muted-foreground">N8N will generate a unique webhook ID automatically</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">• Authentication:</p>
                            <code className="ml-2 text-primary">None</code>
                            <p className="ml-2 mt-1 text-muted-foreground">The app handles authentication via API keys</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">• Response Mode:</p>
                            <code className="ml-2 text-primary">"When Last Node Finishes" or "Using Respond to Webhook Node"</code>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 font-semibold text-foreground">Step 4: Add Your AI Logic</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Connect an AI node (OpenAI, Anthropic, etc.) after the Webhook</li>
                        <li>Use the incoming data: <code className="text-primary">{'{{ $json.chatInput }}'}</code> or <code className="text-primary">{'{{ $json.message }}'}</code></li>
                        <li>The app sends both fields for compatibility</li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 font-semibold text-foreground">Step 5: Add Response (Optional)</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>If you want to send a response back to the app, ensure your workflow returns data</li>
                        <li>The app will display the response in the chat</li>
                        <li>For AI Agent nodes, the response is in: <code className="text-primary">{'{{ $json.output }}'}</code></li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 font-semibold text-foreground">Step 6: Activate Workflow</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Click the "Active" toggle in the top right corner</li>
                        <li><strong className="text-destructive">Important:</strong> Workflow MUST be active to receive webhooks</li>
                        <li>The workflow status should show as "Active" with a green indicator</li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 font-semibold text-foreground">Step 7: Test Your Workflow</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Go to the Home page in this app</li>
                        <li>You should see your workflow listed</li>
                        <li>Click on it to open the chat interface</li>
                        <li>Send a test message like "Hello"</li>
                        <li>Check if you receive a response</li>
                      </ul>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                      <p className="font-semibold text-foreground mb-2">💡 Tips:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>The webhook URL is automatically detected from your workflow</li>
                        <li>You don't need to copy/paste the webhook URL manually</li>
                        <li>Use the Test Connection button above to verify your N8N connection</li>
                        <li>Check browser console (F12) for detailed error messages</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                      <p className="font-semibold text-foreground mb-2">⚠️ Common Issues:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Workflow not showing:</strong> Make sure it's active and has a Webhook node</li>
                        <li><strong>No response:</strong> Check your workflow execution history in N8N</li>
                        <li><strong>CORS errors:</strong> Enable "Use proxy server" option above (self-hosted only)</li>
                        <li><strong>404 errors:</strong> Verify your N8N URL and API key are correct</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
