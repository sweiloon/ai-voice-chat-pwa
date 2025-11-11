import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { Toaster } from '@/components/common/Toaster'
import { UniversalBottomNav } from '@/components/layout/UniversalBottomNav'
import { Home } from '@/routes/Home'
import { Chat } from '@/routes/Chat'
import { Settings } from '@/routes/Settings'
import { Profile } from '@/routes/Profile'
import { N8NWorkflowChatPage } from '@/routes/N8NWorkflowChat'
import { useSessionStore } from '@/store/sessions'
import { useSettingsStore } from '@/store/settings'

const applyThemeClass = (theme: 'light' | 'dark' | 'system') => {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
    return
  }
  root.classList.toggle('dark', theme === 'dark')
}

const AppContent = () => {
  return (
    <div className="h-full">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/workflow/:workflowId" element={<N8NWorkflowChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UniversalBottomNav />
      <Toaster />
    </div>
  )
}

const App = () => {
  const initialize = useSessionStore((state) => state.initialize)
  const theme = useSettingsStore((state) => state.theme)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    applyThemeClass(theme)
    if (theme === 'system') {
      const handler = (event: MediaQueryListEvent) => document.documentElement.classList.toggle('dark', event.matches)
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', handler)
      return () => media.removeEventListener('change', handler)
    }
  }, [theme])

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
