import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'

import { getSessions, saveSession, saveMessage, getMessages } from '@/lib/idb'

const session = {
  id: 'test-session',
  title: 'Test',
  createdAt: 1,
  updatedAt: 1,
}

describe('IndexedDB helpers', () => {
  it('persists sessions and messages', async () => {
    await saveSession(session)
    const sessions = await getSessions()
    expect(sessions).toHaveLength(1)
    await saveMessage({
      id: 'msg-1',
      sessionId: session.id,
      role: 'user',
      content: 'ping',
      createdAt: Date.now(),
    })
    const messages = await getMessages(session.id)
    expect(messages[0]?.content).toBe('ping')
  })
})
