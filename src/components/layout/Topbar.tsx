import { Check, Edit3, Menu } from 'lucide-react'
import { useState } from 'react'

import { InstallPrompt } from '@/components/common/InstallPrompt'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { SettingsSheet } from '@/components/settings/SettingsSheet'
import { useSessionStore } from '@/store/sessions'
import { useIsDesktop } from '@/hooks/useMediaQuery'

interface TopbarProps {
  onMenuClick?: () => void
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { sessions, activeSessionId, renameSession } = useSessionStore()
  const active = sessions.find((session) => session.id === activeSessionId)
  const [title, setTitle] = useState(active?.title ?? '')
  const [editing, setEditing] = useState(false)
  const isDesktop = useIsDesktop()

  const persistTitle = async () => {
    if (!active) return
    await renameSession(active.id, title.trim() || 'Untitled chat')
    setEditing(false)
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center gap-3">
        {!isDesktop && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 transition hover:bg-secondary"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex flex-col">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              className="rounded-lg border border-border bg-transparent px-3 py-1 text-lg font-semibold outline-none"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') persistTitle()
                if (event.key === 'Escape') setEditing(false)
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={persistTitle}
              className="rounded-md border border-border p-1 text-sm text-primary"
              aria-label="Save title"
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-2 text-left text-lg font-semibold"
            onClick={() => {
              setTitle(active?.title ?? '')
              setEditing(true)
            }}
          >
            <span className="truncate">{active?.title ?? 'Conversation'}</span>
            <Edit3 size={16} className="text-muted-foreground" />
          </button>
        )}
        <p className="hidden text-sm text-muted-foreground md:block">Local-first • Voice + text</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <InstallPrompt />
        <ThemeToggle />
        <SettingsSheet />
      </div>
    </header>
  )
}
