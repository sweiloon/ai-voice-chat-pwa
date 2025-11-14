import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { createN8NClient } from '@/n8n/client'
import { triggerWebhook, type WebhookPayload } from '@/n8n/webhookClient'
import type { N8NWorkflow, N8NMessage, N8NSettings } from '@/n8n/types'
import { debugWorkflowWebhook } from '@/n8n/webhookDebug'

interface N8NState {
  // Settings
  settings: N8NSettings
  setSettings: (settings: Partial<N8NSettings>) => void
  testConnection: () => Promise<boolean>

  // Workflows
  workflows: N8NWorkflow[]
  loadingWorkflows: boolean
  fetchWorkflows: () => Promise<void>
  refreshWorkflows: () => Promise<void>

  // Active workflow
  activeWorkflowId?: string
  selectWorkflow: (id: string) => void

  // Messages
  messages: Record<string, N8NMessage[]>
  addMessage: (workflowId: string, message: Omit<N8NMessage, 'id' | 'createdAt'>) => void
  sendMessage: (workflowId: string, content: string, type: 'text' | 'voice') => Promise<void>

  // Utils
  getWorkflowById: (id: string) => N8NWorkflow | undefined
  clearCache: () => void
}

export const useN8NStore = create<N8NState>()(
  persist(
    (set, get) => ({
      // Initial settings
      settings: {
        connected: false,
      },

      workflows: [],
      loadingWorkflows: false,
      messages: {},

      setSettings(newSettings) {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      async testConnection() {
        const { settings } = get()
        if (!settings.baseUrl || !settings.apiKey) {
          return false
        }

        try {
          const client = createN8NClient(settings.baseUrl, settings.apiKey, settings.useProxy)
          const connected = await client.testConnection()
          set((state) => ({
            settings: { ...state.settings, connected },
          }))
          return connected
        } catch (error) {
          console.error('Connection test failed:', error)
          set((state) => ({
            settings: { ...state.settings, connected: false },
          }))
          return false
        }
      },

      async fetchWorkflows() {
        const { settings } = get()
        if (!settings.baseUrl || !settings.apiKey || !settings.connected) {
          return
        }

        set({ loadingWorkflows: true })

        try {
          const client = createN8NClient(settings.baseUrl, settings.apiKey, settings.useProxy)
          const workflows = await client.getWorkflows()
          set({
            workflows,
            loadingWorkflows: false,
            settings: { ...settings, lastSync: Date.now() },
          })
        } catch (error) {
          console.error('Failed to fetch workflows:', error)
          set({ loadingWorkflows: false })
        }
      },

      async refreshWorkflows() {
        // Force clear existing workflows and fetch fresh data
        set({ workflows: [], loadingWorkflows: true })
        await get().fetchWorkflows()
      },

      selectWorkflow(id) {
        set({ activeWorkflowId: id })
      },

      addMessage(workflowId, message) {
        const newMessage: N8NMessage = {
          ...message,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: Date.now(),
        }

        set((state) => ({
          messages: {
            ...state.messages,
            [workflowId]: [...(state.messages[workflowId] || []), newMessage],
          },
        }))
      },

      async sendMessage(workflowId, content, type) {
        const { settings, workflows, addMessage } = get()

        // Add user message
        addMessage(workflowId, {
          workflowId,
          role: 'user',
          content,
        })

        // Find workflow and get webhook URL
        const workflow = workflows.find((w) => w.id === workflowId)
        if (!workflow || !settings.baseUrl) {
          addMessage(workflowId, {
            workflowId,
            role: 'system',
            content: 'Error: Workflow not found or not configured',
          })
          return
        }

        const client = createN8NClient(settings.baseUrl, settings.apiKey!, settings.useProxy)

        // Debug: Inspect workflow structure and webhook data
        debugWorkflowWebhook(workflow, settings.baseUrl)

        const webhookUrl = client.getWebhookUrl(workflow, settings.baseUrl)

        console.log('📋 Workflow:', workflow.name)
        console.log('🔗 Webhook URL:', webhookUrl)
        console.log('📦 Workflow nodes:', workflow.nodes)

        if (!webhookUrl) {
          addMessage(workflowId, {
            workflowId,
            role: 'system',
            content: 'Error: No webhook configured for this workflow. Make sure your workflow has a Webhook node as the first node.',
          })
          return
        }

        // Trigger webhook
        const payload: WebhookPayload = {
          chatInput: content,  // AI Agent expects 'chatInput' field
          message: content,     // Keep for compatibility
          type,
          timestamp: Date.now(),
        }

        console.log('📤 Sending payload:', payload)

        const response = await triggerWebhook(webhookUrl, payload, {
          useProxy: settings.useProxy,
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          instanceType: settings.instanceType
        })

        console.log('📥 Response:', response)

        if (response.success) {
          // Add assistant response if available
          if (response.data) {
            let responseText = ''

            // Extract the output field from N8N response
            if (typeof response.data === 'object' && response.data !== null) {
              // N8N AI Agent returns { output: "message" }
              const data = response.data as Record<string, unknown>
              if ('output' in data && typeof data.output === 'string') {
                responseText = data.output
              } else {
                // Fallback: stringify the whole response
                responseText = JSON.stringify(response.data, null, 2)
              }
            } else if (typeof response.data === 'string') {
              responseText = response.data
            } else {
              responseText = String(response.data)
            }

            addMessage(workflowId, {
              workflowId,
              role: 'assistant',
              content: responseText,
              executionId: response.executionId,
            })
          } else {
            addMessage(workflowId, {
              workflowId,
              role: 'system',
              content: `✅ Workflow triggered successfully${response.executionId ? ` (ID: ${response.executionId})` : ''}`,
            })
          }
        } else {
          addMessage(workflowId, {
            workflowId,
            role: 'system',
            content: `❌ Error: ${response.message || 'Failed to trigger workflow'}`,
          })
        }
      },

      getWorkflowById(id) {
        return get().workflows.find((w) => w.id === id)
      },

      clearCache() {
        set({
          workflows: [],
          messages: {},
          activeWorkflowId: undefined,
          settings: { ...get().settings, lastSync: undefined },
        })
      },
    }),
    {
      name: 'resonance-n8n',
      partialize: (state) => ({
        settings: state.settings,
        messages: state.messages,
      }),
    },
  ),
)
