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

  return (
    <div ref={containerRef} className="space-y-3 md:space-y-4 p-3 md:p-4 bg-gradient-to-b from-background to-secondary/5 min-h-full">
      {!currentMessages.length ? (
        <div className="flex flex-col items-center justify-center gap-3 md:gap-4 text-center text-muted-foreground py-8 md:py-12 min-h-full">
          <div className="rounded-full border-2 border-dashed border-border/50 p-6 md:p-8 bg-primary/5">
            <MessageSquare size={32} className="md:w-10 md:h-10 text-primary" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-base md:text-lg font-semibold text-foreground">Start Conversation</h3>
            <p className="text-xs md:text-sm text-muted-foreground px-4">Use voice or text to chat with AI</p>
          </div>
        </div>
      ) : (
        currentMessages.map((message: MessageRecord) => (
          <MessageItem
            key={message.id}
            message={message}
            onSpeak={
              message.role === 'assistant'
                ? () => speak(message.content, { voice: preferredVoice, rate: settings.ttsRate })
                : undefined
            }
          />
        ))
      )}
    </div>
  )
}
