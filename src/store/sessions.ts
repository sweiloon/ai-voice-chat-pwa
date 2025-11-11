import { create } from 'zustand'

import {
  deleteSession as deleteSessionFromDb,
  exportSnapshot,
  getMessages,
  getSessions,
  importSnapshot,
  saveMessage,
  saveSession,
  updateMessage as updateMessageInDb,
  type MessageRecord,
  type SessionRecord,
} from '@/lib/idb'
import { uuid } from '@/lib/utils'

export interface SessionsState {
  sessions: SessionRecord[]
  messages: Record<string, MessageRecord[]>
  activeSessionId?: string
  loading: boolean
  searchTerm: string
  initialize: () => Promise<void>
  selectSession: (id: string) => void
  createSession: (title?: string) => Promise<string>
  renameSession: (id: string, title: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  addMessage: (input: Omit<MessageRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => Promise<MessageRecord>
  updateMessage: (id: string, patch: Partial<MessageRecord>) => Promise<void>
  ensureMessages: (sessionId: string) => Promise<MessageRecord[]>
  setSearchTerm: (value: string) => void
  exportData: () => Promise<Awaited<ReturnType<typeof exportSnapshot>>>
  importData: (payload: Parameters<typeof importSnapshot>[0]) => Promise<void>
}

const hydrateMessages = (list: MessageRecord[]) =>
  [...list].sort((a, b) => a.createdAt - b.createdAt)

export const useSessionStore = create<SessionsState>((set, get) => ({
  sessions: [],
  messages: {},
  loading: false,
  searchTerm: '',
  async initialize() {
    set({ loading: true })
    let sessions = await getSessions()
    if (!sessions.length) {
      const session: SessionRecord = {
        id: uuid(),
        title: 'First conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await saveSession(session)
      sessions = [session]
    }
    set({
      sessions,
      activeSessionId: sessions[0]?.id,
      loading: false,
    })
  },
  selectSession(id) {
    set({ activeSessionId: id })
  },
  async createSession(title = 'New conversation') {
    const session: SessionRecord = {
      id: uuid(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await saveSession(session)
    set((state) => ({ sessions: [session, ...state.sessions], activeSessionId: session.id }))
    return session.id
  },
  async renameSession(id, title) {
    const session = get().sessions.find((s) => s.id === id)
    if (!session) return
    const updated: SessionRecord = { ...session, title, updatedAt: Date.now() }
    await saveSession(updated)
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? updated : s)),
    }))
  },
  async togglePin(id) {
    const session = get().sessions.find((s) => s.id === id)
    if (!session) return
    const updated: SessionRecord = { ...session, pinned: !session.pinned, updatedAt: Date.now() }
    await saveSession(updated)
    set((state) => ({ sessions: state.sessions.map((s) => (s.id === id ? updated : s)) }))
  },
  async deleteSession(id) {
    await deleteSessionFromDb(id)
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id)
      const { [id]: _removed, ...rest } = state.messages
      const activeSessionId = state.activeSessionId === id ? sessions[0]?.id : state.activeSessionId
      return { sessions, messages: rest, activeSessionId }
    })
  },
  async addMessage(input) {
    const message: MessageRecord = {
      id: input.id ?? uuid(),
      createdAt: input.createdAt ?? Date.now(),
      ...input,
    }
    await saveMessage(message)
    set((state) => ({
      messages: {
        ...state.messages,
        [message.sessionId]: hydrateMessages([...(state.messages[message.sessionId] ?? []), message]),
      },
    }))
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === message.sessionId ? { ...session, updatedAt: Date.now() } : session,
      ),
    }))
    return message
  },
  async updateMessage(id, patch) {
    await updateMessageInDb(id, patch)
    set((state) => {
      const sessionId =
        patch.sessionId ??
        Object.keys(state.messages).find((key) =>
          state.messages[key]?.some((message) => message.id === id),
        ) ??
        state.activeSessionId
      if (!sessionId) return state
      const updated = (state.messages[sessionId] ?? []).map((message) =>
        message.id === id ? { ...message, ...patch } : message,
      )
      return { messages: { ...state.messages, [sessionId]: hydrateMessages(updated) } }
    })
  },
  async ensureMessages(sessionId) {
    const cached = get().messages[sessionId]
    if (cached) return cached
    const rows = await getMessages(sessionId)
    const sorted = hydrateMessages(rows)
    set((state) => ({ messages: { ...state.messages, [sessionId]: sorted } }))
    return sorted
  },
  setSearchTerm(value) {
    set({ searchTerm: value })
  },
  async exportData() {
    return exportSnapshot()
  },
  async importData(payload) {
    await importSnapshot(payload)
    const sessions = await getSessions()
    const activeSessionId = sessions[0]?.id
    const messagesBySession: Record<string, MessageRecord[]> = {}
    for (const session of sessions) {
      messagesBySession[session.id] = hydrateMessages(await getMessages(session.id))
    }
    set({ sessions, messages: messagesBySession, activeSessionId })
  },
}))
