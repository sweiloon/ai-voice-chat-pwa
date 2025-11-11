import { chunkString } from '@/lib/utils'
import type { AiClient, ChatMessage, StreamOptions } from './types'

export const createAnthropicClient = (apiKey?: string): AiClient => ({
  async *streamChat(messages: ChatMessage[], options?: StreamOptions) {
    if (!apiKey) throw new Error('Missing Anthropic API key. Add it in Settings.')

    const payload = {
      model: options?.model ?? 'claude-3-haiku-20240307',
      max_tokens: 512,
      temperature: options?.temperature ?? 0.6,
      messages,
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
      signal: options?.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic request failed: ${error}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text ?? 'No response received.'
    for (const chunk of chunkString(content, 24)) {
      yield chunk
    }
  },
})
