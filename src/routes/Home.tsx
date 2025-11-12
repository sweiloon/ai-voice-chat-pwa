import { Sparkles } from 'lucide-react'
import { WorkflowList } from '@/components/n8n/WorkflowList'
import { SetupGuide } from '@/components/n8n/SetupGuide'

/**
 * Home Route - N8N Workflow Dashboard
 *
 * Primary landing page focusing on N8N workflow interaction
 * Redesigned to prioritize workflows over AI chat
 */
export const Home = () => {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary/10 text-primary">
                <Sparkles size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <h1 className="text-base md:text-lg font-bold text-foreground">
                N8N Workflows
              </h1>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground ml-10 md:ml-11 hidden sm:block">
              Interact with your active workflows
            </p>
          </div>
          <SetupGuide />
        </div>
      </header>

      {/* Scrollable Workflow List with padding for fixed header and navbar */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-secondary/5 pt-[56px] md:pt-[64px] pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <WorkflowList />
        </div>
      </main>
    </div>
  )
}
