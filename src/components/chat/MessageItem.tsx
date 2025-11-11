import { Volume2 } from 'lucide-react'
import type { MessageRecord } from '@/lib/idb'
import { formatTimestamp } from '@/lib/utils'

export const MessageItem = ({ message, onSpeak }: { message: MessageRecord; onSpeak?: () => void }) => {
  const isAssistant = message.role === 'assistant'
  const bubbleClasses = isAssistant
    ? 'bg-secondary text-secondary-foreground'
    : 'bg-primary text-primary-foreground'

  return (
    <div className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'}`} role={message.role}>
      <div className="max-w-2xl space-y-2">
        <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${bubbleClasses}`}>
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{message.role}</span>
          <span aria-hidden>•</span>
          <time dateTime={new Date(message.createdAt).toISOString()}>{formatTimestamp(message.createdAt)}</time>
          {isAssistant && onSpeak && (
            <button
              type="button"
              onClick={onSpeak}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide"
            >
              <Volume2 size={12} /> Speak
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
