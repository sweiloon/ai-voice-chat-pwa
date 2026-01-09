import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MoreVertical, Phone, Video, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { ChatBubble, type Message } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatListItem } from '@/components/chat/ChatList'
import { useSessionStore } from '@/store/sessions'
import { useSpeech } from '@/hooks/useSpeech'
import { cn } from '@/lib/utils'

export const Chat = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { 
    sessions, 
    activeSessionId, 
    selectSession, 
    addMessage, 
    createSession,
    messages,
    ensureMessages
  } = useSessionStore()
  
  const { 
    isListening, 
    startListening, 
    stopListening, 
    transcript, 
    resetTranscript,
    speakText 
  } = useSpeech()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMobileListOpen, setIsMobileListOpen] = useState(!sessionId)

  // Initialize session
  useEffect(() => {
    if (sessionId) {
      selectSession(sessionId)
      ensureMessages(sessionId)
      setIsMobileListOpen(false)
    } else if (!activeSessionId && sessions.length > 0) {
      // If no session ID in URL but we have sessions, go to the first one (desktop)
      if (window.innerWidth >= 768) {
        navigate(`/chat/${sessions[0].id}`)
      }
    }
  }, [sessionId, sessions, activeSessionId, navigate, selectSession, ensureMessages])

  const currentSession = sessions.find(s => s.id === activeSessionId)
  const currentMessages = activeSessionId ? (messages[activeSessionId] || []) : []

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentMessages, transcript])

  const handleSendMessage = async (content: string, type: 'text' | 'audio') => {
    if (!activeSessionId) return

    // User message
    await addMessage({
      sessionId: activeSessionId,
      role: 'user',
      content,
      type
    })

    // Mock AI Response
    setTimeout(async () => {
      const aiResponse = "I'm a cosmic AI assistant. I heard you say: " + content
      await addMessage({
        sessionId: activeSessionId,
        role: 'assistant',
        content: aiResponse,
        type: 'text'
      })
      speakText(aiResponse)
    }, 1000)

    resetTranscript()
  }

  // Convert session messages to UI messages
  const uiMessages: Message[] = currentMessages.map(m => ({
    id: m.id,
    content: m.content,
    sender: m.role === 'user' ? 'user' : 'ai',
    timestamp: new Date(m.createdAt),
    status: 'read',
    type: m.type
  }))

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Chat List Pane (Sidebar) */}
      <div className={cn(
        "w-full md:w-80 border-r bg-card/30 backdrop-blur-xl flex flex-col transition-all duration-300 absolute md:relative z-20 h-full",
        isMobileListOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-lg">Chats</h2>
          <div className="flex gap-2">
             <Button variant="ghost" size="icon" onClick={async () => {
               const newId = await createSession()
               navigate(`/chat/${newId}`)
             }}>
               <MoreVertical size={18} />
             </Button>
          </div>
        </div>
        
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Search chats..."
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-2">
            {sessions.map(session => {
              const sessionMessages = messages[session.id] || []
              const lastMsg = sessionMessages[sessionMessages.length - 1]
              
              return (
                <ChatListItem
                  key={session.id}
                  session={session}
                  lastMessage={lastMsg}
                  isActive={session.id === activeSessionId}
                  onClick={() => navigate(`/chat/${session.id}`)}
                />
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Conversation Pane */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-background/50">
        {/* Chat Header */}
        <header className="h-16 border-b border-white/5 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden -ml-2"
              onClick={() => setIsMobileListOpen(true)}
            >
              <ArrowLeft />
            </Button>
            
            <Avatar className="h-10 w-10 border border-primary/20 shadow-glow-purple">
              <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${activeSessionId}`} />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="font-bold text-sm md:text-base">{currentSession?.title || 'New Conversation'}</h2>
              <p className="text-xs text-primary animate-pulse">
                {isListening ? 'Listening...' : 'Online'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Phone size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Video size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <MoreVertical size={20} />
            </Button>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {uiMessages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            
            {/* Live Transcript Bubble */}
            {transcript && (
              <div className="flex justify-end w-full mb-4 animate-fade-in">
                <div className="bg-primary/10 border border-primary/20 text-foreground px-4 py-2 rounded-2xl rounded-tr-sm shadow-glow-purple backdrop-blur-sm">
                  <p className="text-sm italic opacity-70">{transcript}...</p>
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <ChatInput 
          onSendMessage={handleSendMessage}
          isListening={isListening}
          onStartListening={startListening}
          onStopListening={stopListening}
          transcript={transcript}
        />
      </div>
    </div>
  )
}
