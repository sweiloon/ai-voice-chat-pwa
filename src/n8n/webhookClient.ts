import axios from 'axios'

export interface WebhookPayload {
  chatInput: string  // AI Agent expects 'chatInput' field
  message: string
  type: 'text' | 'voice'
  timestamp: number
  formData?: Record<string, unknown>
}

export interface WebhookResponse {
  success: boolean
  executionId?: string
  data?: unknown
  message?: string
}

export interface WebhookOptions {
  useProxy?: boolean
  baseUrl?: string
  apiKey?: string
  instanceType?: 'cloud' | 'self-hosted'
}

/**
 * Trigger N8N workflow via webhook
 *
 * Supports both direct webhook calls and proxy routing for CORS handling.
 * - Cloud instances: Always use proxy
 * - Self-hosted with useProxy=true: Use proxy
 * - Self-hosted with useProxy=false: Direct call (requires CORS configured)
 */
export const triggerWebhook = async (
  webhookUrl: string,
  payload: WebhookPayload,
  options?: WebhookOptions
): Promise<WebhookResponse> => {
  try {
    const isCloudInstance = options?.baseUrl?.includes('.app.n8n.cloud')
    const shouldUseProxy = isCloudInstance || options?.useProxy

    if (shouldUseProxy) {
      console.log('🔗 [PROXY] Triggering webhook via proxy')
      console.log('📦 Payload:', payload)

      // Route through proxy
      const response = await axios.post('/api/n8n-proxy', {
        method: 'POST',
        url: webhookUrl,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': options?.apiKey || '',
        },
      }, {
        timeout: 30000,
      })

      console.log('✅ Webhook triggered successfully via proxy:', response.data)

      return {
        success: true,
        executionId: response.data?.executionId || response.data?.id,
        data: response.data,
      }
    } else {
      console.log('🔗 [DIRECT] Triggering webhook directly')
      console.log('📦 Payload:', payload)

      // Direct call (requires CORS configured on N8N instance)
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      })

      console.log('✅ Webhook triggered successfully:', response.data)

      return {
        success: true,
        executionId: response.data?.executionId || response.data?.id,
        data: response.data,
      }
    }
  } catch (error) {
    console.error('❌ Webhook trigger failed:', error)

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to trigger workflow'
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      })

      return {
        success: false,
        message: errorMessage,
      }
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Trigger webhook with form data
 */
export const triggerWebhookWithForm = async (
  webhookUrl: string,
  message: string,
  formData: Record<string, unknown>,
  options?: WebhookOptions
): Promise<WebhookResponse> => {
  const payload: WebhookPayload = {
    chatInput: message,  // AI Agent expects 'chatInput' field
    message,
    type: 'text',
    timestamp: Date.now(),
    formData,
  }

  return triggerWebhook(webhookUrl, payload, options)
}

