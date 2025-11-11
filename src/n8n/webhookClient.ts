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

/**
 * Trigger N8N workflow via webhook
 *
 * N8N Cloud webhooks are public and don't need proxy or authentication.
 * They should be called directly from the browser.
 */
export const triggerWebhook = async (
  webhookUrl: string,
  payload: WebhookPayload,
): Promise<WebhookResponse> => {
  try {
    console.log('🔗 [DIRECT] Triggering webhook:', webhookUrl)
    console.log('📦 Payload:', payload)
    console.log('🚀 Calling webhook directly (no proxy)')

    // N8N Cloud webhooks are public and CORS-enabled
    // Call them directly from browser
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
): Promise<WebhookResponse> => {
  const payload: WebhookPayload = {
    chatInput: message,  // AI Agent expects 'chatInput' field
    message,
    type: 'text',
    timestamp: Date.now(),
    formData,
  }

  return triggerWebhook(webhookUrl, payload)
}
