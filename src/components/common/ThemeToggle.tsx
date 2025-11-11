import { Moon, Sun } from 'lucide-react'
import { useMemo } from 'react'

import { useSettingsStore } from '@/store/settings'

const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']

export const ThemeToggle = () => {
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const nextTheme = useMemo(() => {
    const index = themes.indexOf(theme)
    return themes[(index + 1) % themes.length]
  }, [theme])

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-secondary"
    >
      {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}
