import { describe, expect, it } from 'vitest'

import { mockClient } from '@/ai/mockClient'

const collect = async () => {
  const tokens: string[] = []
  for await (const chunk of mockClient.streamChat([{ role: 'user', content: 'Hello there' }])) {
    tokens.push(chunk)
  }
  return tokens.join('')
}

describe('mockClient', () => {
  it('streams deterministic content', async () => {
    const output = await collect()
    expect(output).toMatch(/Hello there/)
  })
})
