import { openDB, type DBSchema } from 'idb'
import type { N8NWorkflow, N8NMessage } from '@/n8n/types'

export type SessionRecord = {
  id: string
  title: string
  systemPrompt?: string
  pinned?: boolean
  createdAt: number
  updatedAt: number
}

export type MessageRecord = {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  audioBlobId?: string
  createdAt: number
}

export type SettingsRecord = {
  id: string
  value: Record<string, unknown>
}

interface ChatDB extends DBSchema {
  sessions: {
    key: string
    value: SessionRecord
    indexes: { 'by-updatedAt': number }
  }
  messages: {
    key: string
    value: MessageRecord
    indexes: { 'by-session': string }
  }
  settings: {
    key: string
    value: SettingsRecord
  }
  'n8n-workflows': {
    key: string
    value: N8NWorkflow
    indexes: { 'by-name': string }
  }
  'n8n-messages': {
    key: string
    value: N8NMessage
    indexes: { 'by-workflow': string }
  }
}

const dbPromise = openDB<ChatDB>('resonance-db', 2, {
  upgrade(db, oldVersion) {
    // Version 1: Original schema
    if (oldVersion < 1) {
      const sessions = db.createObjectStore('sessions', { keyPath: 'id' })
      sessions.createIndex('by-updatedAt', 'updatedAt')

      const messages = db.createObjectStore('messages', { keyPath: 'id' })
      messages.createIndex('by-session', 'sessionId')

      db.createObjectStore('settings', { keyPath: 'id' })
    }

    // Version 2: N8N schema
    if (oldVersion < 2) {
      const n8nWorkflows = db.createObjectStore('n8n-workflows', { keyPath: 'id' })
      n8nWorkflows.createIndex('by-name', 'name')

      const n8nMessages = db.createObjectStore('n8n-messages', { keyPath: 'id' })
      n8nMessages.createIndex('by-workflow', 'workflowId')
    }
  },
})

export const getSessions = async () => {
  const db = await dbPromise
  const sessions = await db.getAll('sessions')
  return sessions.sort((a, b) => b.updatedAt - a.updatedAt)
}

export const saveSession = async (session: SessionRecord) => {
  const db = await dbPromise
  await db.put('sessions', session)
}

export const deleteSession = async (id: string) => {
  const db = await dbPromise
  const tx = db.transaction(['sessions', 'messages'], 'readwrite')
  await tx.objectStore('sessions').delete(id)
  const messageIndex = tx.objectStore('messages').index('by-session')
  let cursor = await messageIndex.openCursor(id)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}

export const getMessages = async (sessionId: string) => {
  const db = await dbPromise
  const index = db.transaction('messages').store.index('by-session')
  return index.getAll(sessionId)
}

export const saveMessage = async (message: MessageRecord) => {
  const db = await dbPromise
  await db.put('messages', message)
}

export const updateMessage = async (id: string, patch: Partial<MessageRecord>) => {
  const db = await dbPromise
  const current = await db.get('messages', id)
  if (!current) return
  await db.put('messages', { ...current, ...patch })
}

export const saveSettings = async (value: Record<string, unknown>) => {
  const db = await dbPromise
  await db.put('settings', { id: 'preferences', value })
}

export const getSettings = async <T>() => {
  const db = await dbPromise
  const record = await db.get('settings', 'preferences')
  return (record?.value as T | undefined) ?? undefined
}

export const exportSnapshot = async () => {
  const db = await dbPromise
  const [sessions, messages, settings] = await Promise.all([
    db.getAll('sessions'),
    db.getAll('messages'),
    db.getAll('settings'),
  ])
  return { sessions, messages, settings }
}

export const importSnapshot = async (data: {
  sessions?: SessionRecord[]
  messages?: MessageRecord[]
  settings?: SettingsRecord[]
}) => {
  const db = await dbPromise
  const tx = db.transaction(['sessions', 'messages', 'settings'], 'readwrite')
  await Promise.all([
    tx.objectStore('sessions').clear(),
    tx.objectStore('messages').clear(),
    tx.objectStore('settings').clear(),
  ])
  await Promise.all([
    ...(data.sessions ?? []).map((session) => tx.objectStore('sessions').put(session)),
    ...(data.messages ?? []).map((message) => tx.objectStore('messages').put(message)),
    ...(data.settings ?? []).map((setting) => tx.objectStore('settings').put(setting)),
  ])
  await tx.done
}

// N8N Workflows
export const getN8NWorkflows = async () => {
  const db = await dbPromise
  return db.getAll('n8n-workflows')
}

export const saveN8NWorkflow = async (workflow: N8NWorkflow) => {
  const db = await dbPromise
  await db.put('n8n-workflows', workflow)
}

export const deleteN8NWorkflow = async (id: string) => {
  const db = await dbPromise
  await db.delete('n8n-workflows', id)
}

// N8N Messages
export const getN8NMessages = async (workflowId: string) => {
  const db = await dbPromise
  const index = db.transaction('n8n-messages').store.index('by-workflow')
  return index.getAll(workflowId)
}

export const saveN8NMessage = async (message: N8NMessage) => {
  const db = await dbPromise
  await db.put('n8n-messages', message)
}
