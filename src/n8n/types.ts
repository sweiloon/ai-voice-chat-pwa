export interface N8NWorkflow {
  id: string
  name: string
  active: boolean
  tags?: Array<{ id: string; name: string }>
  createdAt: string
  updatedAt: string
  nodes?: Array<{
    name: string
    type: string
    typeVersion?: number
    parameters?: Record<string, unknown>
    webhookId?: string
  }>
}

export interface N8NFormField {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'select' | 'textarea' | 'checkbox'
  required?: boolean
  options?: string[]
  defaultValue?: unknown
}

export interface N8NWebhookConfig {
  workflowId: string
  webhookUrl: string
  hasForm: boolean
  formFields?: N8NFormField[]
}

export interface N8NExecution {
  id: string
  workflowId: string
  mode: string
  status: 'running' | 'success' | 'error' | 'waiting' | 'canceled'
  startedAt: string
  finishedAt?: string
  data?: {
    resultData?: {
      runData?: Record<string, unknown>
    }
  }
}

export interface N8NMessage {
  id: string
  workflowId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  executionId?: string
  createdAt: number
}

export interface N8NSettings {
  instanceType?: 'cloud' | 'self-hosted' // Type of N8N instance
  baseUrl?: string
  apiKey?: string
  useProxy?: boolean // For self-hosted: whether to use proxy or direct connection
  connected: boolean
  lastSync?: number
}

export interface N8NApiResponse<T> {
  data: T
}

export interface N8NWorkflowsResponse {
  data: N8NWorkflow[]
  nextCursor?: string
}

export interface N8NError {
  message: string
  code?: string
  httpStatusCode?: number
}
