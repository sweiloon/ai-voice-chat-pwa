import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Mic, MicOff, Send } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { createSpeechRecognizer, getSpeechRecognition } from '@/lib/speech'
import { useN8NStore } from '@/store/n8n'
import { useSettingsStore } from '@/store/settings'
import { getIncompatibilityMessage } from '@/n8n/triggerAnalyzer'

export const WorkflowChat = () => {
  const { workflowId } = useParams<{ workflowId: string }>()
  const navigate = useNavigate()
  const { getWorkflowById, messages, sendMessage } = useN8NStore()
  const { sttLang } = useSettingsStore()

  const workflow = workflowId ? getWorkflowById(workflowId) : undefined
  const workflowMessages = workflowId ? messages[workflowId] || [] : []

  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening'>('idle')
  const [transcript, setTranscript] = useState('')
  const [textInput, setTextInput] = useState('')
  const [sending, setSending] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const supported = Boolean(getSpeechRecognition())

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }, [workflowMessages])

  const startVoiceInput = () => {
    if (!supported) {
      toast.error('Speech Recognition not supported in this browser.')
      return
    }

    const recognition = createSpeechRecognizer(sttLang, {
      onStart: () => setVoiceStatus('listening'),
      onResult: (text, isFinal) => {
        setTranscript(text)
        if (isFinal) {
          void handleSend(text, 'voice')
          setTranscript('')
        }
      },
      onEnd: () => setVoiceStatus('idle'),
      onError: (error) => {
        setVoiceStatus('idle')
        toast.error(`Mic error: ${error}`)
      },
    })

    recognitionRef.current = recognition ?? null
    recognition?.start()
  }

  const stopVoiceInput = () => {
    recognitionRef.current?.stop()
    setVoiceStatus('idle')
  }

  const handleSend = async (content: string, type: 'text' | 'voice' = 'text') => {
    if (!workflowId || !content.trim() || !workflow) return

    // Validate workflow compatibility before sending
    const incompatibilityMessage = getIncompatibilityMessage(workflow, type)
    if (incompatibilityMessage) {
      toast.error('Cannot send message', {
        description: incompatibilityMessage,
        duration: 5000
      })
      return
    }

    setSending(true)
    try {
      await sendMessage(workflowId, content.trim(), type)
      setTextInput('')
      setTranscript('')
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!workflow) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading workflow...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col relative">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex h-12 md:h-14 items-center gap-2 md:gap-3 px-3 md:px-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg transition-all hover:bg-secondary active:scale-95"
          >
            <ArrowLeft size={18} className="md:w-5 md:h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-sm md:text-base font-semibold">{workflow.name}</h2>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">N8N Workflow Chat</p>
          </div>
        </div>
      </header>

      {/* Scrollable Messages Area with padding for fixed header and fixed input */}
      <div className="flex-1 overflow-hidden pt-[48px] md:pt-[56px] pb-[calc(220px+env(safe-area-inset-bottom))] md:pb-[calc(240px+env(safe-area-inset-bottom))]">
        <div ref={containerRef} className="h-full space-y-3 md:space-y-4 overflow-y-auto p-3 md:p-4 bg-gradient-to-b from-background to-secondary/5">
        {workflowMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 md:gap-4 text-center text-muted-foreground py-8 md:py-12 min-h-full">
            <div className="rounded-full border-2 border-dashed border-border/50 p-6 md:p-8 bg-primary/5">
              <Mic size={32} className="md:w-10 md:h-10 text-primary" />
            </div>
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-base md:text-lg font-semibold text-foreground">Start Conversation</h3>
              <p className="text-xs md:text-sm text-muted-foreground px-4">Use voice or text to interact with this workflow</p>
            </div>
          </div>
        ) : (
          workflowMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-xl px-3 py-2 md:px-4 md:py-2.5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : msg.role === 'system'
                      ? 'bg-muted/80 text-muted-foreground border border-border/50'
                      : 'bg-card border border-border/50'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-xs md:text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* Fixed Input at bottom (above navbar) */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 border-t border-border/50 bg-card/80 backdrop-blur-sm p-3 md:p-4">
        {/* Voice Input (Primary) */}
        <div className="mb-3 flex flex-col gap-2 md:gap-3 rounded-xl border border-border/50 bg-card/80 p-3 md:p-4">
          <div className="flex items-center justify-between text-xs md:text-sm font-medium">
            <span className="text-foreground flex items-center gap-1.5 md:gap-2">
              <Mic size={14} className="md:w-4 md:h-4 text-primary" />
              Voice Input
            </span>
            <span className={`text-[10px] md:text-xs transition-colors ${voiceStatus === 'listening' ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
              {voiceStatus === 'listening' ? '🔴 Listening' : 'Tap to speak'}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              disabled={sending || !supported}
              className={`inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl text-white shadow-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                voiceStatus === 'listening'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
              onClick={voiceStatus === 'listening' ? stopVoiceInput : startVoiceInput}
            >
              {voiceStatus === 'listening' ? <MicOff size={20} className="md:w-6 md:h-6" /> : <Mic size={20} className="md:w-6 md:h-6" />}
            </button>
            <div className="flex-1 min-h-[2.5rem] md:min-h-[3rem] flex items-center rounded-lg bg-secondary/30 px-3 md:px-4 py-2">
              {transcript ? (
                <span className="text-xs md:text-sm font-medium text-foreground">{transcript}</span>
              ) : (
                <span className="text-xs md:text-sm text-muted-foreground">
                  {supported ? 'Ready to listen' : 'Not supported'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Text Input (Secondary) */}
        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend(textInput)
              }
            }}
            placeholder="Or type your message..."
            className="flex-1 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            disabled={sending}
          />
          <button
            type="button"
            onClick={() => void handleSend(textInput)}
            disabled={!textInput.trim() || sending}
            className="inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="md:w-5 md:h-5 animate-spin" /> : <Send size={16} className="md:w-5 md:h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
