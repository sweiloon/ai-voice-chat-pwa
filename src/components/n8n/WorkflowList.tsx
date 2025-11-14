import { useEffect } from 'react'
import { AlertCircle, Loader2, RefreshCw, Workflow as WorkflowIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useN8NStore } from '@/store/n8n'
import { WorkflowCard } from './WorkflowCard'

export const WorkflowList = () => {
  const { workflows, loadingWorkflows, settings, fetchWorkflows, refreshWorkflows } = useN8NStore()

  // Auto-fetch workflows on mount or when connection is restored
  useEffect(() => {
    if (settings.connected && !loadingWorkflows) {
      // Check if we need to refresh (stale data or first load)
      const now = Date.now()
      const lastSync = settings.lastSync || 0
      const isStale = now - lastSync > 5 * 60 * 1000 // 5 minutes
      const isFirstLoad = workflows.length === 0

      if (isFirstLoad || isStale) {
        void fetchWorkflows()
      }
    }
  }, [settings.connected, loadingWorkflows, fetchWorkflows, settings.lastSync, workflows.length])

  const handleRefresh = async () => {
    try {
      await refreshWorkflows()
      toast.success('Workflows refreshed', {
        description: `${workflows.length} workflow${workflows.length !== 1 ? 's' : ''} loaded`
      })
    } catch (error) {
      toast.error('Failed to refresh workflows', {
        description: 'Please check your connection and try again'
      })
    }
  }

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
    <>
      {/* Fixed "Active Workflows" Header below main header */}
      <div className="fixed top-[56px] md:top-[64px] left-0 right-0 z-30 flex items-center justify-between bg-background/80 backdrop-blur-sm pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 border-b border-border/50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-xl font-bold text-foreground">
              Active Workflows
            </h1>
            <p className="text-xs text-muted-foreground">
              {workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'}
              {settings.lastSync && (
                <span className="ml-2">
                  • Updated {new Date(settings.lastSync).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 md:gap-2 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm px-3 py-2 text-xs md:text-sm font-medium transition-all hover:bg-card hover:shadow-sm hover:border-primary/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loadingWorkflows}
          >
            <RefreshCw size={14} className={`md:w-4 md:h-4 ${loadingWorkflows ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Workflow Grid with padding for fixed header */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-[80px] md:pt-[96px]">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
      </div>
    </>
  )
}
