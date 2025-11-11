import type { N8NWorkflow } from './types'

/**
 * Trigger types supported by N8N workflows
 */
export type TriggerType =
  | 'webhook'      // Can receive HTTP POST data
  | 'chat'         // Can receive chat messages
  | 'form'         // Can receive form submissions
  | 'schedule'     // Time-based, no external input
  | 'manual'       // User-initiated, no external input
  | 'email'        // Email trigger
  | 'unknown'      // Unable to determine

/**
 * Trigger capability information for a workflow
 */
export interface TriggerCapability {
  /** Type of trigger detected */
  type: TriggerType

  /** Can receive any external input */
  canReceiveInput: boolean

  /** Can receive text messages */
  canReceiveText: boolean

  /** Can receive voice (audio) input */
  canReceiveVoice: boolean

  /** Requires special setup/configuration */
  setupRequired: boolean

  /** Human-readable description */
  description: string

  /** Recommended action for user */
  recommendation?: string
}

/**
 * Analyze workflow trigger type and capabilities
 *
 * Examines the first node of a workflow to determine what type of
 * trigger it uses and whether it can receive text/voice input
 *
 * @param workflow - N8N workflow to analyze
 * @returns Trigger capability information
 */
export function analyzeTrigger(workflow: N8NWorkflow): TriggerCapability {
  const firstNode = workflow.nodes?.[0]

  // No nodes = unknown
  if (!firstNode) {
    return {
      type: 'unknown',
      canReceiveInput: false,
      canReceiveText: false,
      canReceiveVoice: false,
      setupRequired: false,
      description: 'Unable to determine workflow trigger type',
      recommendation: 'Check your workflow configuration in N8N'
    }
  }

  const nodeType = firstNode.type.toLowerCase()

  // Webhook trigger - best for text/voice input
  if (nodeType.includes('webhook')) {
    return {
      type: 'webhook',
      canReceiveInput: true,
      canReceiveText: true,
      canReceiveVoice: true,
      setupRequired: false,
      description: 'Webhook trigger - accepts HTTP POST requests',
      recommendation: 'Compatible with text and voice input'
    }
  }

  // Chat trigger - designed for chat messages
  if (nodeType.includes('chat')) {
    return {
      type: 'chat',
      canReceiveInput: true,
      canReceiveText: true,
      canReceiveVoice: true,
      setupRequired: false,
      description: 'Chat trigger - accepts chat messages',
      recommendation: 'Compatible with text and voice input'
    }
  }

  // Form trigger - accepts form submissions
  if (nodeType.includes('form')) {
    return {
      type: 'form',
      canReceiveInput: true,
      canReceiveText: true,
      canReceiveVoice: false,
      setupRequired: true,
      description: 'Form trigger - accepts form submissions',
      recommendation: 'Compatible with text input only (no voice)'
    }
  }

  // Schedule/Cron trigger - time-based, no external input
  if (nodeType.includes('schedule') || nodeType.includes('cron') || nodeType.includes('interval')) {
    return {
      type: 'schedule',
      canReceiveInput: false,
      canReceiveText: false,
      canReceiveVoice: false,
      setupRequired: false,
      description: 'Schedule trigger - runs on a timer',
      recommendation: 'Cannot receive external input. Use webhook or chat trigger instead.'
    }
  }

  // Manual trigger - user clicks in N8N to run
  if (nodeType.includes('manual') || nodeType.includes('start')) {
    return {
      type: 'manual',
      canReceiveInput: false,
      canReceiveText: false,
      canReceiveVoice: false,
      setupRequired: false,
      description: 'Manual trigger - requires manual execution in N8N',
      recommendation: 'Cannot receive external input. Use webhook or chat trigger instead.'
    }
  }

  // Email trigger
  if (nodeType.includes('email') || nodeType.includes('imap')) {
    return {
      type: 'email',
      canReceiveInput: false,
      canReceiveText: false,
      canReceiveVoice: false,
      setupRequired: false,
      description: 'Email trigger - activated by incoming emails',
      recommendation: 'Not compatible with text/voice input from this app'
    }
  }

  // Unknown trigger type
  return {
    type: 'unknown',
    canReceiveInput: false,
    canReceiveText: false,
    canReceiveVoice: false,
    setupRequired: false,
    description: `Unknown trigger type: ${firstNode.type}`,
    recommendation: 'Use webhook or chat trigger for text/voice input'
  }
}

/**
 * Get a user-friendly error message for incompatible workflows
 *
 * @param workflow - Workflow to check
 * @param inputType - Type of input being attempted ('text' or 'voice')
 * @returns Error message or null if compatible
 */
export function getIncompatibilityMessage(
  workflow: N8NWorkflow,
  inputType: 'text' | 'voice'
): string | null {
  const capability = analyzeTrigger(workflow)

  // Check if workflow can receive any input
  if (!capability.canReceiveInput) {
    return `Cannot send to "${workflow.name}". This workflow uses ${capability.type} trigger which cannot receive external input. ${capability.recommendation}`
  }

  // Check voice compatibility
  if (inputType === 'voice' && !capability.canReceiveVoice) {
    return `Voice not supported for "${workflow.name}". This workflow's ${capability.type} trigger doesn't support voice input. Please type your message instead.`
  }

  // Check text compatibility
  if (inputType === 'text' && !capability.canReceiveText) {
    return `Text not supported for "${workflow.name}". This workflow's ${capability.type} trigger doesn't support text input.`
  }

  // Compatible
  return null
}

/**
 * Check if a workflow is compatible with text/voice input
 *
 * @param workflow - Workflow to check
 * @returns true if compatible, false otherwise
 */
export function isWorkflowCompatible(workflow: N8NWorkflow): boolean {
  const capability = analyzeTrigger(workflow)
  return capability.canReceiveInput && (capability.canReceiveText || capability.canReceiveVoice)
}
