import { useState, useEffect, useCallback, useRef } from 'react'
import { createSpeechRecognizer, type SpeechStatus } from '@/lib/speech'
import { speak, stopSpeaking, listVoices, type SpeakOptions } from '@/lib/tts'

export type UseSpeechReturn = {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  speakText: (text: string, options?: SpeakOptions) => void
  stopSpeaking: () => void
  resetTranscript: () => void
  voices: SpeechSynthesisVoice[]
  status: SpeechStatus
}

export const useSpeech = (lang: string = 'en-US'): UseSpeechReturn => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      const v = listVoices()
      setVoices(v)
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  useEffect(() => {
    // Initialize recognition
    const recognition = createSpeechRecognizer(lang, {
      onStart: () => {
        setIsListening(true)
        setStatus('recording')
      },
      onEnd: () => {
        setIsListening(false)
        setStatus('idle')
      },
      onError: (error) => {
        console.error('Speech recognition error:', error)
        setStatus('error')
        setIsListening(false)
      },
      onResult: (text, isFinal) => {
        if (isFinal) {
          setTranscript((prev) => prev + ' ' + text)
          setInterimTranscript('')
        } else {
          setInterimTranscript(text)
        }
      },
    })

    recognitionRef.current = recognition || null

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [lang])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.error('Failed to start recognition:', e)
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const speakText = useCallback((text: string, options?: SpeakOptions) => {
    setIsSpeaking(true)
    // Wrap speak in a way to know when it ends (simplified)
    // In a real app, we'd want better events from TTS lib
    speak(text, options)
    
    // Rough estimation of speaking duration or polling
    // For now, we'll just set a timeout or rely on user interaction
    // A better implementation would attach onend to the utterance in lib/tts
    const estimatedDuration = text.length * 50 + 1000
    setTimeout(() => setIsSpeaking(false), estimatedDuration)
  }, [])

  const stopSpeakingAction = useCallback(() => {
    stopSpeaking()
    setIsSpeaking(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    speakText,
    stopSpeaking: stopSpeakingAction,
    resetTranscript,
    voices,
    status,
  }
}
