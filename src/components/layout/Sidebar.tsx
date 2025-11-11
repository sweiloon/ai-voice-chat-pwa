import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Pin, PinOff, Plus, Search, Trash, X } from 'lucide-react'

import { useSessionStore } from '@/store/sessions'
import { useIsDesktop } from '@/hooks/useMediaQuery'

const SessionList = ({
  title,
  sessions,
  activeId,
  onSelect,
  onTogglePin,
  onDelete,
}: {
  title: string
  sessions: ReturnType<typeof useSessionStore.getState>['sessions']
  activeId?: string
  onSelect: (id: string) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}) => {
  if (!sessions.length) return null
  return (
    <div>
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <ul className="space-y-1">
        {sessions.map((session) => (
          <li key={session.id}>
            <div
              className={`group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                activeId === session.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              onClick={() => onSelect(session.id)}
            >
              <span className="truncate text-sm font-medium">{session.title}</span>
              <span className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Toggle pin"
                  className="text-muted-foreground hover:text-primary"
                  onClick={(event) => {
                    event.stopPropagation()
                    onTogglePin(session.id)
                  }}
                >
                  {session.pinned ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
                <button
                  type="button"
                  aria-label="Delete session"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(session.id)
                  }}
                >
                  <Trash size={14} />
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const {
    sessions,
    activeSessionId,
    createSession,
    selectSession,
    togglePin,
    deleteSession,
    searchTerm,
    setSearchTerm,
    loading,
  } = useSessionStore()
  const [creating, setCreating] = useState(false)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const pinned = useMemo(() => sessions.filter((session) => session.pinned), [sessions])
  const rest = useMemo(() => sessions.filter((session) => !session.pinned), [sessions])
  const filteredPinned = searchTerm
    ? pinned.filter((session) => session.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : pinned
  const filteredRest = searchTerm
    ? rest.filter((session) => session.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : rest

  // Don't render sidebar on mobile when closed
  if (!isDesktop && !isOpen) return null

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {!isDesktop && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`flex h-full w-72 flex-col border-r border-border bg-card/60 p-4 backdrop-blur-lg ${
          !isDesktop ? 'fixed left-0 top-0 z-50' : ''
        }`}
      >
      <div className="mb-4 flex items-center gap-2">
        {!isDesktop && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-secondary"
          >
            <X size={20} />
          </button>
        )}
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          onClick={async () => {
            try {
              setCreating(true)
              const id = await createSession()
              selectSession(id)
              if (!isDesktop) onClose?.()
            } finally {
              setCreating(false)
            }
          }}
        >
          {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} New chat
        </button>
      </div>
      <label className="mb-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2">
        <Search size={16} className="text-muted-foreground" />
        <input
          ref={searchRef}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search sessions (Cmd+K)"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </label>
      {loading ? (
        <div className="mt-8 flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 animate-spin" size={16} /> Loading...
        </div>
      ) : (
        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          <SessionList
            title="Pinned"
            sessions={filteredPinned}
            activeId={activeSessionId}
            onSelect={selectSession}
            onTogglePin={togglePin}
            onDelete={deleteSession}
          />
          <SessionList
            title="All"
            sessions={filteredRest}
            activeId={activeSessionId}
            onSelect={selectSession}
            onTogglePin={togglePin}
            onDelete={deleteSession}
          />
        </div>
      )}
      </aside>
    </>
  )
}
