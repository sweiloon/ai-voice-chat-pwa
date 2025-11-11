import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { saveSettings } from '@/lib/idb'

export type Provider = 'mock' | 'openai' | 'anthropic'

export type SettingsSnapshot = {
  theme: 'light' | 'dark' | 'system'
  provider: Provider
  openaiKey?: string
  anthropicKey?: string
  sttLang: string
  ttsVoice?: string
  ttsRate: number
  autoSendFromVoice: boolean
  playAssistantAudio: boolean
}

type SettingsState = SettingsSnapshot & {
  ready: boolean
  setTheme: (theme: SettingsSnapshot['theme']) => void
  setProvider: (provider: Provider) => void
  setValue: <K extends keyof SettingsSnapshot>(key: K, value: SettingsSnapshot[K]) => void
}

const defaults: SettingsSnapshot = {
  theme: 'system',
  provider: 'mock',
  sttLang: 'en-US',
  ttsRate: 1,
  autoSendFromVoice: false,
  playAssistantAudio: true,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      ready: true,
      setTheme(theme) {
        set({ theme })
      },
      setProvider(provider) {
        set({ provider })
      },
      setValue(key, value) {
        set({ [key]: value } as Partial<SettingsSnapshot>)
      },
    }),
    {
      name: 'resonance-settings',
      partialize: (state) => ({
        theme: state.theme,
        provider: state.provider,
        openaiKey: state.openaiKey,
        anthropicKey: state.anthropicKey,
        sttLang: state.sttLang,
        ttsVoice: state.ttsVoice,
        ttsRate: state.ttsRate,
        autoSendFromVoice: state.autoSendFromVoice,
        playAssistantAudio: state.playAssistantAudio,
      }),
    },
  ),
)

if (typeof window !== 'undefined') {
  useSettingsStore.subscribe((state) => {
    const snapshot: SettingsSnapshot = {
      theme: state.theme,
      provider: state.provider,
      openaiKey: state.openaiKey,
      anthropicKey: state.anthropicKey,
      sttLang: state.sttLang,
      ttsVoice: state.ttsVoice,
      ttsRate: state.ttsRate,
      autoSendFromVoice: state.autoSendFromVoice,
      playAssistantAudio: state.playAssistantAudio,
    }
    saveSettings(snapshot)
  })
}
