import { useEffect } from 'react'
import { AlertCircle, Loader2, RefreshCw, Workflow as WorkflowIcon } from 'lucide-react'

import { useN8NStore } from '@/store/n8n'
import { WorkflowCard } from './WorkflowCard'

export const WorkflowList = () => {
  const { workflows, loadingWorkflows, settings, fetchWorkflows, refreshWorkflows } = useN8NStore()

  useEffect(() => {
    if (settings.connected && workflows.length === 0 && !loadingWorkflows) {
      void fetchWorkflows()
    }
  }, [settings.connected, workflows.length, loadingWorkflows, fetchWorkflows])

  if (!settings.baseUrl || !settings.apiKey) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="rounded-full border-2 border-dashed border-border/50 p-10 bg-gradient-to-br from-primary/5 to-transparent">
          <AlertCircle size={48} className="text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
            N8N Not Configured
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Please configure your N8N instance in settings to get started.
          </p>
        </div>
      </div>
    )
  }

  if (!settings.connected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="rounded-full border-2 border-dashed border-destructive/30 p-10 bg-gradient-to-br from-destructive/5 to-transparent">
          <AlertCircle size={48} className="text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Connection Failed</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Unable to connect to N8N. Please check your settings and try again.
          </p>
        </div>
      </div>
    )
  }

  if (loadingWorkflows) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse-glow" />
          <Loader2 size={48} className="animate-spin text-primary relative z-10" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Loading workflows...</p>
      </div>
    )
  }

  if (workflows.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="rounded-full border-2 border-dashed border-border/50 p-10 bg-gradient-to-br from-primary/5 to-transparent">
          <WorkflowIcon size={48} className="text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">No Active Workflows</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Create and activate workflows in your N8N instance to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-5">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/60 backdrop-blur-sm pb-3 md:pb-4 border-b border-border/50">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-xl font-bold text-foreground">
            Active Workflows
          </h1>
          <p className="text-xs text-muted-foreground">
            {workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshWorkflows()}
          className="inline-flex items-center gap-1.5 md:gap-2 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm px-3 py-2 text-xs md:text-sm font-medium transition-all hover:bg-card hover:shadow-sm hover:border-primary/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loadingWorkflows}
        >
          <RefreshCw size={14} className={`md:w-4 md:h-4 ${loadingWorkflows ? 'animate-spin text-primary' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
      </div>
    </div>
  )
}
