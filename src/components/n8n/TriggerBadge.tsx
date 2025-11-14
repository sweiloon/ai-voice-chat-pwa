import { CheckCircle2, XCircle, AlertCircle, Clock, Hand, Mail, Webhook as WebhookIcon, MessageSquare, FileInput, Database, Rss, FolderOpen, AlertTriangle, Blocks } from 'lucide-react'
import type { TriggerType, TriggerCapability } from '@/n8n/triggerAnalyzer'

interface TriggerBadgeProps {
  capability: TriggerCapability
  /** Show full description on hover */
  showTooltip?: boolean
}

/**
 * TriggerBadge - Visual indicator for workflow trigger type and compatibility
 *
 * Features:
 * - Color-coded badges (green = compatible, red = incompatible, gray = unknown)
 * - Icons for each trigger type
 * - Tooltip with description
 * - Responsive sizing
 */
export const TriggerBadge = ({ capability, showTooltip = true }: TriggerBadgeProps) => {
  // Determine badge color and icon based on compatibility
  const isCompatible = capability.canReceiveInput
  const colorClasses = isCompatible
    ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
    : 'bg-gradient-to-br from-red-500/10 to-red-600/10 text-red-700 dark:text-red-400 border-red-500/30'

  const unknownClasses = 'bg-gradient-to-br from-gray-500/10 to-gray-600/10 text-gray-700 dark:text-gray-400 border-gray-500/30'

  // Icon mapping for trigger types
  const getIcon = (type: TriggerType) => {
    const iconProps = { size: 12, className: 'shrink-0 md:w-3.5 md:h-3.5' }

    switch (type) {
      case 'webhook':
        return <WebhookIcon {...iconProps} />
      case 'chat':
        return <MessageSquare {...iconProps} />
      case 'form':
        return <FileInput {...iconProps} />
      case 'schedule':
        return <Clock {...iconProps} />
      case 'manual':
        return <Hand {...iconProps} />
      case 'email':
        return <Mail {...iconProps} />
      case 'mqtt':
      case 'sqs':
      case 'rabbitmq':
      case 'redis':
      case 'kafka':
        return <Database {...iconProps} />
      case 'rss':
        return <Rss {...iconProps} />
      case 'file':
        return <FolderOpen {...iconProps} />
      case 'error':
        return <AlertTriangle {...iconProps} />
      case 'app-specific':
        return <Blocks {...iconProps} />
      case 'unknown':
      default:
        return <AlertCircle {...iconProps} />
    }
  }

  // Label text for trigger type
  const getLabel = (type: TriggerType, appName?: string): string => {
    switch (type) {
      case 'webhook':
        return 'Webhook'
      case 'chat':
        return 'Chat'
      case 'form':
        return 'Form'
      case 'schedule':
        return 'Schedule'
      case 'manual':
        return 'Manual'
      case 'email':
        return 'Email'
      case 'mqtt':
        return 'MQTT'
      case 'sqs':
        return 'SQS'
      case 'rabbitmq':
        return 'RabbitMQ'
      case 'redis':
        return 'Redis'
      case 'kafka':
        return 'Kafka'
      case 'rss':
        return 'RSS'
      case 'file':
        return 'File'
      case 'error':
        return 'Error'
      case 'app-specific':
        return appName || 'App'
      case 'unknown':
      default:
        return 'Unknown'
    }
  }

  const badgeClasses = capability.type === 'unknown' ? unknownClasses : colorClasses

  return (
    <div className="group relative inline-flex">
      <div
        className={`inline-flex items-center gap-1 md:gap-1.5 rounded-md border px-2 md:px-2.5 py-0.5 md:py-1 text-[10px] md:text-xs font-medium transition-all ${badgeClasses}`}
        role="status"
        aria-label={`Trigger type: ${capability.description}`}
      >
        {getIcon(capability.type)}
        <span className="font-semibold">{getLabel(capability.type, capability.appName)}</span>
        {isCompatible ? (
          <CheckCircle2 size={10} className="ml-0.5 md:w-3 md:h-3" />
        ) : capability.type !== 'unknown' ? (
          <XCircle size={10} className="ml-0.5 md:w-3 md:h-3" />
        ) : null}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 group-hover:block animate-fade-in">
          <div className="rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-2 text-[11px] text-popover-foreground shadow-lg max-w-xs">
            <p className="font-semibold mb-1">{capability.description}</p>
            {capability.recommendation && (
              <p className="text-muted-foreground leading-relaxed">{capability.recommendation}</p>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-[5px] border-transparent border-t-border/50" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
