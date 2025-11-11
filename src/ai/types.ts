export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type StreamOptions = {
  model?: string
  temperature?: number
  signal?: AbortSignal
}

export interface AiClient {
  streamChat: (messages: ChatMessage[], options?: StreamOptions) => AsyncIterable<string>
}

export type AiProviderKey = 'mock' | 'openai' | 'anthropic'
