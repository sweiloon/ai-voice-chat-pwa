import { MessageSquare, Workflow, Settings, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

/**
 * UniversalBottomNav - Bottom navigation bar for all devices (mobile/tablet/desktop)
 *
 * Features:
 * - Renders on ALL devices (not just mobile)
 * - Four nav items: Home (N8N) | AI Chat | Settings | Profile
 * - Responsive touch targets (min 44px)
 * - Active state indicators
 * - Safe area support for notched devices
 */
export const UniversalBottomNav = () => {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const navItems = [
    {
      path: '/',
      icon: Workflow,
      label: 'Home',
      description: 'N8N Workflows'
    },
    {
      path: '/chat',
      icon: MessageSquare,
      label: 'AI Chat',
      description: 'Voice Assistant'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Configuration'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile',
      description: 'Your Account'
    }
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-card/80 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Main navigation"
      style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex h-14 md:h-16 items-center justify-around px-2 md:px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center gap-0.5 md:gap-1
                rounded-lg py-1.5 px-2 md:px-3 transition-all duration-200
                min-h-[44px] max-w-[120px] relative
                ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground active:scale-95'
                }
              `}
              aria-label={item.description}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon container */}
              <div className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg transition-all ${
                active
                  ? 'bg-primary/10'
                  : ''
              }`}>
                <Icon
                  size={20}
                  className="md:w-[22px] md:h-[22px]"
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>

              <span className={`text-[10px] md:text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <div className="absolute top-1 right-1/2 translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
