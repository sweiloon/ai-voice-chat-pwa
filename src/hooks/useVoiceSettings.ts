import { useEffect, useMemo, useState } from 'react'
import { listVoices } from '@/lib/tts'

/**
 * Custom hook for managing voice synthesis settings
 * Handles voice list loading and updates
 */
export const useVoiceSettings = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    const loadVoices = () => setVoices(listVoices())
    loadVoices()

    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const voiceOptions = useMemo(() => voices.map((voice) => voice.name), [voices])

  return { voices, voiceOptions }
}
