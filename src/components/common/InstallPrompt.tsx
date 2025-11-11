import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const InstallPrompt = () => {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!event) return null

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-secondary"
      onClick={async () => {
        await event.prompt()
        const { outcome } = await event.userChoice
        if (outcome !== 'dismissed') {
          setEvent(null)
        }
      }}
    >
      Install app
    </button>
  )
}
