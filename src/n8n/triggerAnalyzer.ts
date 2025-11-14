import type { N8NWorkflow, N8NFormField } from './types'

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
  | 'mqtt'         // MQTT trigger
  | 'sqs'          // AWS SQS trigger
  | 'rabbitmq'     // RabbitMQ trigger
  | 'redis'        // Redis trigger
  | 'kafka'        // Kafka trigger
  | 'rss'          // RSS Feed trigger
  | 'file'         // File system trigger
  | 'error'        // Error trigger
  | 'app-specific' // App-specific trigger (GitHub, Slack, etc.)
  | 'unknown'      // Unable to determine

/**
 * Exact N8N node type mappings for accurate detection
 * Based on official N8N node library
 */
const NODE_TYPE_MAP: Record<string, TriggerType> = {
  // Webhook triggers
  'n8n-nodes-base.webhook': 'webhook',
  '@n8n/n8n-nodes-langchain.webhookTrigger': 'webhook',
  'n8n-nodes-base.ssetrigger': 'webhook',

  // Chat triggers
  'n8n-nodes-base.chatTrigger': 'chat',
  '@n8n/n8n-nodes-langchain.chatTrigger': 'chat',

  // Form triggers
  'n8n-nodes-base.formTrigger': 'form',
  'n8n-nodes-base.form': 'form',

  // Schedule triggers
  'n8n-nodes-base.scheduleTrigger': 'schedule',
  'n8n-nodes-base.cron': 'schedule',
  'n8n-nodes-base.interval': 'schedule',

  // Manual triggers
  'n8n-nodes-base.manualTrigger': 'manual',
  'n8n-nodes-base.start': 'manual',
  'n8n-nodes-base.manualworkflowtrigger': 'manual',
  'n8n-nodes-base.activationtrigger': 'manual',

  // Email triggers
  'n8n-nodes-base.emailTrigger': 'email',
  'n8n-nodes-base.imapTrigger': 'email',
  'n8n-nodes-base.emailReadImap': 'email',

  // Message queue triggers
  'n8n-nodes-base.mqttTrigger': 'mqtt',
  'n8n-nodes-base.awsSqs': 'sqs',
  'n8n-nodes-base.rabbitmqTrigger': 'rabbitmq',
  'n8n-nodes-base.redisTrigger': 'redis',
  'n8n-nodes-base.kafkaTrigger': 'kafka',

  // RSS/Feed triggers
  'n8n-nodes-base.rssFeedRead': 'rss',
  'n8n-nodes-base.rssfeedreadtrigger': 'rss',

  // File system triggers
  'n8n-nodes-base.localFileTrigger': 'file',
  'n8n-nodes-base.localfiletrigger': 'file',

  // Error/Workflow triggers
  'n8n-nodes-base.errorTrigger': 'error',
  'n8n-nodes-base.errortrigger': 'error',
  'n8n-nodes-base.n8nTrigger': 'webhook',
  'n8n-nodes-base.n8ntrigger': 'webhook',
}

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

  /** Display name for app-specific triggers (e.g., "GitHub", "Slack") */
  appName?: string
}

/**
 * Extract app name from app-specific trigger node type
 * Examples:
 *   - "n8n-nodes-base.githubTrigger" -> "GitHub"
 *   - "n8n-nodes-base.slackTrigger" -> "Slack"
 *   - "@n8n/n8n-nodes-langchain.mcptrigger" -> "MCP"
 */
function extractAppName(nodeType: string): string {
  // Remove common prefixes
  const cleaned = nodeType
    .replace('n8n-nodes-base.', '')
    .replace('@n8n/n8n-nodes-langchain.', '')
    .replace('Trigger', '')
    .replace('trigger', '')

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

/**
 * Detect if a node type is an app-specific trigger
 * Pattern: ends with "Trigger" or "trigger" and contains app name
 */
function isAppSpecificTrigger(nodeType: string): boolean {
  const lower = nodeType.toLowerCase()

  // Must end with "trigger"
  if (!lower.endsWith('trigger')) return false

  // Exclude known core triggers
  const excludeList = [
    'webhook', 'chat', 'form', 'schedule', 'manual', 'email',
    'mqtt', 'sqs', 'rabbitmq', 'redis', 'kafka', 'rss', 'cron',
    'interval', 'imap', 'sse', 'error', 'activation', 'local',
    'n8n', 'workflow'
  ]

  return !excludeList.some(excluded => lower.includes(excluded))
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

  const nodeType = firstNode.type

  // Try exact match first (most accurate)
  const exactMatch = NODE_TYPE_MAP[nodeType]
  if (exactMatch) {
    return getTriggerCapabilityByType(exactMatch, nodeType)
  }

  // Check if it's an app-specific trigger (GitHub, Slack, etc.)
  if (isAppSpecificTrigger(nodeType)) {
    return getTriggerCapabilityByType('app-specific', nodeType)
  }

  // Fallback to substring matching for unlisted node types
  const nodeTypeLower = nodeType.toLowerCase()

  // Webhook trigger - best for text/voice input
  if (nodeTypeLower.includes('webhook')) {
    return getTriggerCapabilityByType('webhook', nodeType)
  }

  // Chat trigger - designed for chat messages
  if (nodeTypeLower.includes('chat')) {
    return getTriggerCapabilityByType('chat', nodeType)
  }

  // Form trigger - accepts form submissions
  if (nodeTypeLower.includes('form')) {
    return getTriggerCapabilityByType('form', nodeType)
  }

  // Schedule/Cron trigger - time-based, no external input
  if (nodeTypeLower.includes('schedule') || nodeTypeLower.includes('cron') || nodeTypeLower.includes('interval')) {
    return getTriggerCapabilityByType('schedule', nodeType)
  }

  // Manual trigger - user clicks in N8N to run
  if (nodeTypeLower.includes('manual') || nodeTypeLower.includes('start')) {
    return getTriggerCapabilityByType('manual', nodeType)
  }

  // Email trigger
  if (nodeTypeLower.includes('email') || nodeTypeLower.includes('imap')) {
    return getTriggerCapabilityByType('email', nodeType)
  }

  // Message queue triggers
  if (nodeTypeLower.includes('mqtt')) {
    return getTriggerCapabilityByType('mqtt', nodeType)
  }
  if (nodeTypeLower.includes('sqs')) {
    return getTriggerCapabilityByType('sqs', nodeType)
  }
  if (nodeTypeLower.includes('rabbitmq')) {
    return getTriggerCapabilityByType('rabbitmq', nodeType)
  }
  if (nodeTypeLower.includes('redis')) {
    return getTriggerCapabilityByType('redis', nodeType)
  }
  if (nodeTypeLower.includes('kafka')) {
    return getTriggerCapabilityByType('kafka', nodeType)
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
 * Get trigger capability configuration by trigger type
 * Centralized configuration for consistent capabilities
 */
function getTriggerCapabilityByType(type: TriggerType, nodeType: string): TriggerCapability {
  switch (type) {
    case 'webhook':
      return {
        type: 'webhook',
        canReceiveInput: true,
        canReceiveText: true,
        canReceiveVoice: true,
        setupRequired: false,
        description: 'Webhook trigger - accepts HTTP POST requests',
        recommendation: 'Compatible with text and voice input'
      }

    case 'chat':
      return {
        type: 'chat',
        canReceiveInput: true,
        canReceiveText: true,
        canReceiveVoice: true,
        setupRequired: false,
        description: 'Chat trigger - accepts chat messages',
        recommendation: 'Compatible with text and voice input'
      }

    case 'form':
      return {
        type: 'form',
        canReceiveInput: true,
        canReceiveText: true,
        canReceiveVoice: false,
        setupRequired: true,
        description: 'Form trigger - accepts form submissions',
        recommendation: 'Compatible with form input (no voice)'
      }

    case 'schedule':
      return {
        type: 'schedule',
        canReceiveInput: false,
        canReceiveText: false,
        canReceiveVoice: false,
        setupRequired: false,
        description: 'Schedule trigger - runs on a timer',
        recommendation: 'Cannot receive external input. Use webhook or chat trigger instead.'
      }

    case 'manual':
      return {
        type: 'manual',
        canReceiveInput: false,
        canReceiveText: false,
        canReceiveVoice: false,
        setupRequired: false,
        description: 'Manual trigger - requires manual execution in N8N',
        recommendation: 'Cannot receive external input. Use webhook or chat trigger instead.'
      }

    case 'email':
      return {
        type: 'email',
        canReceiveInput: false,
        canReceiveText: false,
        canReceiveVoice: false,
        setupRequired: false,
        description: 'Email trigger - activated by incoming emails',
        recommendation: 'Not compatible with text/voice input from this app'
      }

    case 'mqtt':
    case 'sqs':
    case 'rabbitmq':
    case 'redis':
    case 'kafka':
      return {
        type,
        canReceiveInput: false,
        canReceiveText: false,
        canReceiveVoice: false,
        setupRequired: false,
        description: `${type.toUpperCase()} trigger - message queue based`,
        recommendation: 'Not compatible with text/voice input from this app'
      }

    case 'rss':
      return {
        type: 'rss',
        canReceiveInput: false,
        canReceiveText: false,
        canReceiveVoice: false,
        setupRequired: false,
        description: 'RSS Feed trigger - monitors RSS feeds',
        recommendation: 'Not compatible with text/voice input from this app'
      }

    case 'file':
      return {
        type: 'file',
        canReceiveInput: false,
        canReceiveText: false,
        canReceiveVoice: false,
        setupRequired: false,
        description: 'File trigger - monitors file system changes',
        recommendation: 'Not compatible with text/voice input from this app'
      }

    case 'error':
      return {
        type: 'error',
        canReceiveInput: false,
        canReceiveText: false,
        canReceiveVoice: false,
        setupRequired: false,
        description: 'Error trigger - activated on workflow errors',
        recommendation: 'Not compatible with text/voice input from this app'
      }

    case 'app-specific':
      const appName = extractAppName(nodeType)
      return {
        type: 'app-specific',
        canReceiveInput: false,
        canReceiveText: false,
        canReceiveVoice: false,
        setupRequired: true,
        description: `${appName} trigger - monitors ${appName} events`,
        recommendation: 'Not compatible with text/voice input from this app',
        appName
      }

    default:
      return {
        type: 'unknown',
        canReceiveInput: false,
        canReceiveText: false,
        canReceiveVoice: false,
        setupRequired: false,
        description: `Unknown trigger type: ${nodeType}`,
        recommendation: 'Use webhook or chat trigger for text/voice input'
      }
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

/**
 * Extract form fields from a Form trigger workflow
 *
 * @param workflow - N8N workflow with form trigger
 * @returns Array of form fields or null if not a form trigger
 */
export function extractFormFields(workflow: N8NWorkflow): N8NFormField[] | null {
  const firstNode = workflow.nodes?.[0]
  if (!firstNode) return null

  // Check if it's a form trigger
  const capability = analyzeTrigger(workflow)
  if (capability.type !== 'form') return null

  // Try to extract form fields from node parameters
  const parameters = firstNode.parameters as Record<string, unknown> | undefined
  if (!parameters) {
    // Return default generic message field if no parameters
    return getDefaultFormFields()
  }

  // Try multiple extraction strategies
  let formFields: Array<Record<string, unknown>> | undefined

  // Strategy 1: Try 'formFields' parameter (most common)
  formFields = parameters.formFields as Array<Record<string, unknown>> | undefined

  // Strategy 2: Try 'fields' parameter (alternative naming)
  if (!formFields || !Array.isArray(formFields)) {
    formFields = parameters.fields as Array<Record<string, unknown>> | undefined
  }

  // Strategy 3: Try 'form' parameter (nested structure)
  if (!formFields || !Array.isArray(formFields)) {
    const formParam = parameters.form as Record<string, unknown> | undefined
    if (formParam) {
      formFields = formParam.fields as Array<Record<string, unknown>> | undefined
    }
  }

  // If all strategies failed, return default generic form
  if (!formFields || !Array.isArray(formFields) || formFields.length === 0) {
    console.debug('No form fields found in parameters, using default form')
    return getDefaultFormFields()
  }

  // Map N8N form fields to our format
  return formFields.map((field, index) => ({
    name: String(field.fieldLabel || field.name || field.fieldName || `field_${index}`),
    label: String(field.fieldLabel || field.label || field.name || `Field ${index + 1}`),
    type: mapN8NFieldType(String(field.fieldType || field.type || 'text')),
    required: Boolean(field.requiredField || field.required || false),
    options: field.fieldOptions || field.options
      ? String(field.fieldOptions || field.options)
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : undefined,
    defaultValue: field.defaultValue || field.default,
  }))
}

/**
 * Get default form fields when extraction fails
 * Returns a generic message input field
 */
function getDefaultFormFields(): N8NFormField[] {
  return [
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
    }
  ]
}

/**
 * Map N8N field types to our supported types
 */
function mapN8NFieldType(n8nType: string): N8NFormField['type'] {
  const type = n8nType.toLowerCase()

  switch (type) {
    case 'text':
    case 'input':
      return 'text'
    case 'number':
      return 'number'
    case 'email':
      return 'email'
    case 'select':
    case 'dropdown':
      return 'select'
    case 'textarea':
    case 'multiline':
      return 'textarea'
    case 'checkbox':
    case 'boolean':
      return 'checkbox'
    default:
      return 'text'
  }
}
