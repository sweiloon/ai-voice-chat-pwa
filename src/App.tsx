import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'

import { Home } from '@/routes/Home'
import { Chat } from '@/routes/Chat'
import { Settings } from '@/routes/Settings'
import { Marketplace } from '@/routes/Marketplace'
import { Login } from '@/routes/Login'
import { Register } from '@/routes/Register'
import { Profile } from '@/routes/Profile'
import { MainLayout } from '@/components/layout/MainLayout'
import { useSessionStore } from '@/store/sessions'
import { useSettingsStore } from '@/store/settings'

const applyThemeClass = (theme: 'light' | 'dark' | 'system') => {
  const root = document.documentElement
  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    root.classList.add(systemTheme)
    return
  }

  root.classList.add(theme)
}

const AppContent = () => {
  return (
    <div className="h-full">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:sessionId" element={<Chat />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
      <Toaster />
    </BrowserRouter>
  )
}

export default App
