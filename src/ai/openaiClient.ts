import { chunkString } from '@/lib/utils'
import type { AiClient, ChatMessage, StreamOptions } from './types'

export const createOpenAiClient = (apiKey?: string): AiClient => ({
  async *streamChat(messages: ChatMessage[], options?: StreamOptions) {
    if (!apiKey) throw new Error('Missing OpenAI API key. Add it in Settings.')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model ?? 'gpt-4o-mini',
        temperature: options?.temperature ?? 0.6,
        messages,
      }),
      signal: options?.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI request failed: ${error}`)
    }

    const payload = await response.json()
    const content: string = payload.choices?.[0]?.message?.content ?? 'No response received.'
    for (const chunk of chunkString(content, 24)) {
      yield chunk
    }
  },
})
