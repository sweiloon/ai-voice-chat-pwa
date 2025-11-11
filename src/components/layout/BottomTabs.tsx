import { MessageSquare, Workflow } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { useIsMobile } from '@/hooks/useMediaQuery'

export const BottomTabs = () => {
  const location = useLocation()
  const isMobile = useIsMobile()

  if (!isMobile) return null

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-around px-4 safe-area-pb">
        <Link
          to="/"
          className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 transition ${
            isActive('/')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare size={24} />
          <span className="text-xs font-medium">AI Chat</span>
        </Link>

        <Link
          to="/n8n"
          className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 transition ${
            isActive('/n8n')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Workflow size={24} />
          <span className="text-xs font-medium">N8N</span>
        </Link>
      </div>
    </nav>
  )
}
