import { ChevronRight, Pause, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { N8NWorkflow } from '@/n8n/types'
import { analyzeTrigger } from '@/n8n/triggerAnalyzer'
import { TriggerBadge } from './TriggerBadge'

interface WorkflowCardProps {
  workflow: N8NWorkflow
}

export const WorkflowCard = ({ workflow }: WorkflowCardProps) => {
  const capability = analyzeTrigger(workflow)

  return (
    <Link
      to={`/workflow/${workflow.id}`}
      className="group block animate-fade-in"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98]">
        {/* Gradient overlay for active workflows */}
        {workflow.active && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        )}

        <div className="relative p-3 md:p-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 md:gap-3 mb-3">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg transition-all shrink-0 ${
                workflow.active
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {workflow.active ? (
                  <Zap size={18} className="md:w-5 md:h-5" strokeWidth={2.5} />
                ) : (
                  <Pause size={18} className="md:w-5 md:h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {workflow.name}
                </h3>
                <p className="text-xs text-muted-foreground hidden md:block">
                  {workflow.active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-secondary/50 text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary shrink-0">
              <ChevronRight size={14} className="md:w-4 md:h-4" />
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            <TriggerBadge capability={capability} />
            <span className="text-[10px] md:text-xs text-muted-foreground">
              {new Date(workflow.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Bottom accent line for active workflows */}
        {workflow.active && (
          <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-primary to-purple-500 opacity-40 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </Link>
  )
}
