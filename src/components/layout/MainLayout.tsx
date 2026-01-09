import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  MessageSquare, 
  Settings, 
  Store, 
  User, 
  Menu,
  X,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/store/sessions'

export const MainLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { createSession } = useSessionStore()

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const navItems = [
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: Store, label: 'Marketplace', path: '/marketplace' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  const handleNewChat = () => {
    const newSessionId = createSession()
    navigate(`/chat/${newSessionId}`)
  }

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card/50 backdrop-blur-xl">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2 px-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Resonance</span>
          </div>
        </div>

        <div className="p-3">
          <Button 
            onClick={handleNewChat} 
            className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-glow-purple"
          >
            <Plus size={18} />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname.startsWith(item.path) ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start gap-3",
                  location.pathname.startsWith(item.path) && "bg-white/5 text-primary shadow-glow-blue"
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={18} />
                {item.label}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5 border border-white/5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-accent to-primary" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Demo User</p>
              <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">Resonance</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-20 px-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname.startsWith(item.path) ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3 text-lg h-12"
                onClick={() => navigate(item.path)}
              >
                <item.icon size={20} />
                {item.label}
              </Button>
            ))}
            <Button 
              onClick={() => {
                handleNewChat()
                setIsMobileMenuOpen(false)
              }}
              className="w-full justify-start gap-3 mt-4 bg-primary text-white"
            >
              <Plus size={20} />
              New Chat
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
