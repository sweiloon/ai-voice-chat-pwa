import { isBrowser } from './utils'

export type SpeakOptions = {
  voice?: SpeechSynthesisVoice | null
  rate?: number
}

export const listVoices = () => {
  if (!isBrowser) return []
  return window.speechSynthesis.getVoices()
}

export const speak = (text: string, options?: SpeakOptions) => {
  if (!isBrowser) return
  stopSpeaking()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = options?.rate ?? 1
  if (options?.voice) utterance.voice = options.voice
  window.speechSynthesis.speak(utterance)
}

export const stopSpeaking = () => {
  if (!isBrowser) return
  window.speechSynthesis.cancel()
}
