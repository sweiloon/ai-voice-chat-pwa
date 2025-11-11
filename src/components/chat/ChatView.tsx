import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare } from 'lucide-react'

import { MessageItem } from '@/components/chat/MessageItem'
import type { MessageRecord } from '@/lib/idb'
import { listVoices, speak } from '@/lib/tts'
import { useSessionStore } from '@/store/sessions'
import { useSettingsStore } from '@/store/settings'

export const ChatView = () => {
  const { activeSessionId, messages, ensureMessages } = useSessionStore()
  const settings = useSettingsStore()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const lastSpokenRef = useRef<string>('')

  useEffect(() => {
    if (!activeSessionId) return
    void ensureMessages(activeSessionId)
  }, [activeSessionId, ensureMessages])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const loadVoices = () => setVoices(listVoices())
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const currentMessages = messages[activeSessionId ?? ''] ?? []

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }, [currentMessages])

  const preferredVoice = useMemo(() => {
    if (!voices.length) return undefined
    return voices.find((voice) => voice.name === settings.ttsVoice) ?? voices[0]
  }, [voices, settings.ttsVoice])

  useEffect(() => {
    if (!settings.playAssistantAudio) return
    const last = currentMessages[currentMessages.length - 1]
    if (!last || last.role !== 'assistant' || lastSpokenRef.current === last.id) return
    speak(last.content, { voice: preferredVoice, rate: settings.ttsRate })
    lastSpokenRef.current = last.id
  }, [currentMessages, preferredVoice, settings.playAssistantAudio, settings.ttsRate])

  if (!currentMessages.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-muted-foreground">
        <div className="rounded-full border border-dashed border-border p-6">
          <MessageSquare size={32} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Start chatting</h2>
          <p className="text-sm">Type a prompt or use the voice controls below.</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4 md:space-y-6 md:px-6 md:py-8">
      {currentMessages.map((message: MessageRecord) => (
        <MessageItem
          key={message.id}
          message={message}
          onSpeak={
            message.role === 'assistant'
              ? () => speak(message.content, { voice: preferredVoice, rate: settings.ttsRate })
              : undefined
          }
        />
      ))}
    </div>
  )
}
