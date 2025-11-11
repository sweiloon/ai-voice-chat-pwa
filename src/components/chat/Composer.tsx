import { Loader2, Send, StopCircle, Upload } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { getClient } from '@/ai'
import type { ChatMessage } from '@/ai/types'
import { useSessionStore } from '@/store/sessions'
import { useSettingsStore } from '@/store/settings'
import { VoiceControls } from './VoiceControls'

export const Composer = () => {
  const {
    activeSessionId,
    createSession,
    addMessage,
    updateMessage,
    ensureMessages,
  } = useSessionStore()
  const settings = useSettingsStore()
  const [value, setValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [activeSessionId])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setValue('')
    setIsStreaming(true)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const sessionId = activeSessionId ?? (await createSession('New conversation'))
      await ensureMessages(sessionId)
      await addMessage({ sessionId, role: 'user', content: trimmed })
      const snapshot = useSessionStore.getState().messages[sessionId] ?? []
      const assistantMessage = await addMessage({ sessionId, role: 'assistant', content: '' })

      const history = snapshot.map((message) => ({
        role: message.role as ChatMessage['role'],
        content: message.content,
      }))

      const client = getClient(settings)
      let buffer = ''
      for await (const token of client.streamChat(history, { signal: controller.signal })) {
        buffer += token
        await updateMessage(assistantMessage.id, { content: buffer })
      }
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Unable to complete the request')
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await send(value)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col gap-3 border-t border-border bg-background/80 px-4 py-3 md:flex-row md:gap-4 md:px-6 md:py-4">
      <div className="flex flex-1 flex-col gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ask anything... (Cmd+Enter to send)"
          className="min-h-[48px] w-full resize-none rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm text-foreground shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          rows={2}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              void send(value)
            }
            if (event.key === 'Escape' && isStreaming) {
              abortRef.current?.abort()
              setIsStreaming(false)
            }
          }}
        />
        <VoiceControls onSubmit={send} disabled={isStreaming} />
      </div>
      <div className="flex items-center justify-end gap-2 md:flex-col md:items-end">
        <label className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground transition hover:text-foreground">
          <Upload size={18} />
          <input type="file" className="hidden" aria-label="Attach file" />
        </label>
        {isStreaming ? (
          <button
            type="button"
            aria-label="Stop response"
            onClick={() => {
              abortRef.current?.abort()
              setIsStreaming(false)
            }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive text-destructive-foreground shadow-lg transition hover:opacity-90"
          >
            <StopCircle size={18} />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Send message"
            disabled={!value.trim()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStreaming ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        )}
      </div>
    </form>
  )
}
