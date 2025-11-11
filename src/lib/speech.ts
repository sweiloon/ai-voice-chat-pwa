import { isBrowser } from './utils'

export type SpeechStatus = 'idle' | 'recording' | 'error'

export const getSpeechRecognition = () => {
  if (!isBrowser) return undefined
  return (window.SpeechRecognition || window.webkitSpeechRecognition) as typeof window.SpeechRecognition | undefined
}

export type SpeechRecognitionEvents = {
  onResult?: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
}

export const createSpeechRecognizer = (lang: string, events: SpeechRecognitionEvents) => {
  const Recognition = getSpeechRecognition()
  if (!Recognition) return undefined
  const recognition = new Recognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = lang

  recognition.onstart = () => events.onStart?.()
  recognition.onerror = (event) => events.onError?.(event.error)
  recognition.onend = () => events.onEnd?.()
  recognition.onresult = (event) => {
    for (const result of event.results) {
      const transcript = result[0]?.transcript ?? ''
      events.onResult?.(transcript, result.isFinal)
    }
  }
  return recognition
}
