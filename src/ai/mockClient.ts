import { delay, chunkString } from '@/lib/utils'
import type { AiClient, ChatMessage, StreamOptions } from './types'

const templates = [
  'Echoing your thought: {content}',
  'Here is a reflective take on "{content}" with actionable next steps.',
  'Noted! {content} inspires the following idea.',
]

const pickTemplate = (prompt: string) => {
  const index = Math.floor(Math.random() * templates.length)
  return templates[index].replace('{content}', prompt)
}

export const mockClient: AiClient = {
  async *streamChat(messages: ChatMessage[], options?: StreamOptions) {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user')
    const base = lastUser?.content ?? 'Hello there'
    const augmented = `${pickTemplate(base)}\n\nMock model: ${options?.model ?? 'gpt-sim'}`
    for (const chunk of chunkString(augmented, 18)) {
      await delay(80)
      yield chunk
    }
  },
}
