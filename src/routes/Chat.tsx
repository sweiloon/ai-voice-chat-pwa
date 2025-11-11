import { useState } from 'react'

import { ChatView } from '@/components/chat/ChatView'
import { Composer } from '@/components/chat/Composer'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useIsDesktop } from '@/hooks/useMediaQuery'

/**
 * AI Chat Route - Voice assistant chat interface
 *
 * Moved from Home route as part of N8N-first redesign
 * Features: Chat history, voice input/output, sidebar navigation
 */
export const Chat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isDesktop = useIsDesktop()

  return (
    <div className="flex h-screen bg-background pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <Sidebar isOpen={isDesktop || sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex w-full flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <ChatView />
        <Composer />
      </main>
    </div>
  )
}
