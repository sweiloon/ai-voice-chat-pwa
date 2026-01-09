import { useState, useRef, useEffect } from 'react'
import { Send, Mic, Paperclip, Smile, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (content: string, type: 'text' | 'audio') => void
  isListening?: boolean
  onStartListening?: () => void
  onStopListening?: () => void
  transcript?: string
}

export const ChatInput = ({ 
  onSendMessage, 
  isListening = false,
  onStartListening,
  onStopListening,
  transcript = ''
}: ChatInputProps) => {
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Update message when transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage(transcript)
    }
  }, [transcript])

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message, 'text')
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 bg-background/80 backdrop-blur-xl border-t border-white/5">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Attachments */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
          <Paperclip size={20} />
        </Button>

        {/* Input Area */}
        <div className="flex-1 relative bg-card/50 border border-white/10 rounded-2xl focus-within:border-primary/50 focus-within:shadow-glow-purple transition-all">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Type a message..."}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3 px-4 min-h-[44px]"
            autoComplete="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent">
              <Smile size={18} />
            </Button>
          </div>
        </div>

        {/* Voice / Send Button */}
        {message.trim() ? (
          <Button 
            onClick={handleSend}
            size="icon" 
            className="rounded-full h-11 w-11 bg-primary hover:bg-primary/90 text-white shadow-glow-purple animate-fade-in"
          >
            <Send size={20} className="ml-0.5" />
          </Button>
        ) : (
          <Button 
            onClick={isListening ? onStopListening : onStartListening}
            size="icon" 
            className={cn(
              "rounded-full h-11 w-11 transition-all duration-300",
              isListening 
                ? "bg-destructive hover:bg-destructive/90 animate-pulse shadow-glow-purple" 
                : "bg-card hover:bg-card/80 border border-white/10 text-muted-foreground"
            )}
          >
            {isListening ? <StopCircle size={24} /> : <Mic size={20} />}
          </Button>
        )}
      </div>
    </div>
  )
}
