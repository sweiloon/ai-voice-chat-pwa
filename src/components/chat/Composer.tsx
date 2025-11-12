import { Loader2, Send, StopCircle } from 'lucide-react'
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

  // Auto-resize textarea based on content
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = 120 // Max height in pixels (approximately 5-6 lines)
    const scrollHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${scrollHeight}px`
  }

  return (
    <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm p-3 md:p-4">
      {/* Voice Input (Primary) */}
      <div className="mb-3">
        <VoiceControls onSubmit={send} disabled={isStreaming} />
      </div>

      {/* Text Input (Secondary) */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          ref={(el) => {
            textareaRef.current = el
            adjustTextareaHeight(el)
          }}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            adjustTextareaHeight(e.target)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send(value)
            }
            if (e.key === 'Escape' && isStreaming) {
              abortRef.current?.abort()
              setIsStreaming(false)
            }
          }}
          placeholder="Or type your message..."
          className="flex-1 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 resize-none overflow-y-auto min-h-[40px] max-h-[120px]"
          disabled={isStreaming}
          rows={1}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={() => {
              abortRef.current?.abort()
              setIsStreaming(false)
            }}
            className="inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-destructive text-destructive-foreground shadow-md transition-all hover:shadow-lg active:scale-95 self-end"
          >
            <StopCircle size={16} className="md:w-5 md:h-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!value.trim()}
            className="inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 self-end"
          >
            <Send size={16} className="md:w-5 md:h-5" />
          </button>
        )}
      </form>
    </div>
  )
}
