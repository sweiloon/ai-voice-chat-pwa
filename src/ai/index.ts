import type { SettingsSnapshot } from '@/store/settings'

import { createAnthropicClient } from './anthropicClient'
import { mockClient } from './mockClient'
import { createOpenAiClient } from './openaiClient'
import type { AiClient, AiProviderKey } from './types'

const cache: Partial<Record<AiProviderKey, AiClient>> = {}

export const getClient = (settings: SettingsSnapshot): AiClient => {
  if (settings.provider === 'mock') {
    cache.mock ??= mockClient
    return cache.mock
  }

  if (settings.provider === 'openai') {
    cache.openai = createOpenAiClient(settings.openaiKey)
    return cache.openai
  }

  cache.anthropic = createAnthropicClient(settings.anthropicKey)
  return cache.anthropic
}
