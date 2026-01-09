import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { type SessionRecord, type MessageRecord } from '@/lib/idb'
import { formatDistanceToNow } from 'date-fns'

interface ChatListItemProps {
  session: SessionRecord
  lastMessage?: MessageRecord
  isActive: boolean
  onClick: () => void
}

export const ChatListItem = ({ session, lastMessage, isActive, onClick }: ChatListItemProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent",
        isActive 
          ? "bg-primary/10 border-primary/20 shadow-glow-purple" 
          : "hover:bg-white/5 hover:border-white/5"
      )}
    >
      <Avatar className="h-12 w-12 border border-white/10 shadow-md">
        <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${session.id}`} />
        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">AI</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={cn("font-semibold truncate", isActive ? "text-primary" : "text-foreground")}>
            {session.title || 'New Chat'}
          </h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
            {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground truncate">
          {lastMessage ? lastMessage.content : 'No messages yet'}
        </p>
      </div>
    </div>
  )
}
