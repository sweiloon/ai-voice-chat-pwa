import { Mic, MicOff, Pause, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { createSpeechRecognizer, getSpeechRecognition } from '@/lib/speech'
import { useSettingsStore } from '@/store/settings'

interface Props {
  onSubmit: (text: string) => Promise<void>
  disabled?: boolean
}

export const VoiceControls = ({ onSubmit, disabled }: Props) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'error'>('idle')
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const autoSend = useSettingsStore((state) => state.autoSendFromVoice)
  const setValue = useSettingsStore((state) => state.setValue)
  const sttLang = useSettingsStore((state) => state.sttLang)
  const supported = Boolean(getSpeechRecognition())

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  const start = () => {
    if (!supported) return toast.error('Speech Recognition not supported in this browser.')
    const recognition = createSpeechRecognizer(sttLang, {
      onStart: () => setStatus('listening'),
      onResult: async (text, isFinal) => {
        setTranscript(text)
        if (isFinal && autoSend) {
          await onSubmit(text)
          setTranscript('')
        }
      },
      onEnd: () => setStatus('idle'),
      onError: (error) => {
        setStatus('error')
        toast.error(`Mic error: ${error}`)
      },
    })
    recognitionRef.current = recognition ?? null
    recognition?.start()
  }

  const stop = () => {
    recognitionRef.current?.stop()
    setStatus('idle')
  }

  if (!supported) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        Voice input is not supported in this browser. Try the latest Chrome or Edge builds.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card/60 px-3 py-2 md:px-4 md:py-3">
      <div className="flex items-center justify-between text-xs font-medium md:text-sm">
        <span className="text-muted-foreground">Voice input</span>
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={autoSend}
            onChange={(event) => setValue('autoSendFromVoice', event.target.checked)}
          />
          Auto send
        </label>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          disabled={disabled}
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition ${
            status === 'listening' ? 'bg-red-500' : 'bg-emerald-500'
          } disabled:cursor-not-allowed disabled:opacity-60`}
          onClick={status === 'listening' ? stop : start}
        >
          {status === 'listening' ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <div className="flex-1 text-sm text-muted-foreground">
          {transcript ? (
            <span className="font-medium text-foreground">{transcript}</span>
          ) : (
            <span className="italic">{status === 'listening' ? 'Listening…' : 'Tap to capture speech.'}</span>
          )}
        </div>
        <button
          type="button"
          className="rounded-full border border-border p-2 text-muted-foreground"
          onClick={() => setTranscript('')}
        >
          <RefreshCw size={14} />
        </button>
        <button
          type="button"
          className="rounded-full border border-border p-2 text-muted-foreground"
          disabled={!transcript}
          onClick={async () => {
            await onSubmit(transcript)
            setTranscript('')
          }}
        >
          <Pause size={14} />
        </button>
      </div>
    </div>
  )
}
