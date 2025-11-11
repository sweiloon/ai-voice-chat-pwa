import { Toaster as Sonner } from 'sonner'

export const Toaster = () => (
  <Sonner
    closeButton
    position="top-center"
    theme="system"
    toastOptions={{
      className: 'bg-card text-card-foreground border border-border',
    }}
  />
)
