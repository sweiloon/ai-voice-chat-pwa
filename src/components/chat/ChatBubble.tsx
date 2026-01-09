import { cn } from '@/lib/utils'
import { Check, CheckCheck, Clock, Bot, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'

export interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  status: 'sending' | 'sent' | 'delivered' | 'read'
  type?: 'text' | 'audio' | 'image'
}

interface ChatBubbleProps {
  message: Message
  isGroup?: boolean
}

export const ChatBubble = ({ message, isGroup = false }: ChatBubbleProps) => {
  const isUser = message.sender === 'user'

  return (
    <div className={cn("flex w-full mb-4 animate-slide-up", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[85%] md:max-w-[70%] gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
        
        {/* Avatar */}
        <Avatar className="h-8 w-8 mt-1 shadow-lg border border-white/10">
          <AvatarFallback className={cn(
            "text-xs font-bold",
            isUser ? "bg-primary text-white" : "bg-accent text-black"
          )}>
            {isUser ? <User size={14} /> : <Bot size={14} />}
          </AvatarFallback>
        </Avatar>

        {/* Bubble */}
        <div className={cn(
          "relative px-4 py-2 rounded-2xl shadow-md backdrop-blur-sm border",
          isUser 
            ? "bg-primary/20 border-primary/20 text-foreground rounded-tr-sm shadow-glow-purple" 
            : "bg-card/60 border-white/10 text-foreground rounded-tl-sm shadow-glass"
        )}>
          {/* Sender Name (Group only) */}
          {isGroup && !isUser && (
            <p className="text-xs font-bold text-accent mb-1">AI Assistant</p>
          )}

          {/* Content */}
          <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Metadata */}
          <div className={cn(
            "flex items-center gap-1 mt-1 text-[10px]",
            isUser ? "justify-end text-primary-foreground/70" : "justify-start text-muted-foreground"
          )}>
            <span>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {/* Status icon or tail SVG */}
            {isUser && (
              <>
                {message.status === 'sending' && <Clock size={10} className="text-primary-foreground/50" />}
                {message.status === 'sent' && <Check size={10} className="text-primary-foreground/50" />}
                {message.status === 'delivered' && <CheckCheck size={10} className="text-primary-foreground/50" />}
                {message.status === 'read' && <CheckCheck size={10} className="text-blue-400" />}
              </>
            )}
          </div>

          {/* Bubble Tail SVG */}
          <svg
            className={cn(
              "absolute bottom-0 w-4 h-4",
              isUser
                ? "right-[-6px] text-primary/20"
                : "left-[-6px] text-card/60"
            )}
            viewBox="0 0 10 10"
            preserveAspectRatio="none"
          >
            <path d="M0 0 L10 0 L10 10 C10 10 10 0 0 0 Z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

