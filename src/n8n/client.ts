import axios, { type AxiosInstance } from 'axios'
import type { N8NWorkflow, N8NWorkflowsResponse, N8NExecution, N8NError } from './types'

export class N8NClient {
  private client: AxiosInstance
  private useProxy: boolean

  constructor(baseUrl: string, apiKey: string, useProxy?: boolean) {
    // Remove trailing slash from baseURL if present
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

    // Determine if proxy should be used:
    // 1. Explicit useProxy parameter (for self-hosted with user preference)
    // 2. Auto-detect N8N Cloud and always use proxy
    const isN8NCloud = cleanBaseUrl.includes('.app.n8n.cloud') || cleanBaseUrl.includes('n8n.cloud')
    this.useProxy = useProxy !== undefined ? useProxy : isN8NCloud

    // Determine proxy URL based on current environment
    // Production: Use Vercel serverless function
    // Development: Use local proxy server
    const isProduction = typeof window !== 'undefined' &&
                        (window.location.hostname.includes('vercel.app') ||
                         window.location.hostname.includes('vercel.com') ||
                         window.location.protocol === 'https:')

    const proxyUrl = isProduction
      ? '/api/n8n-proxy'  // Vercel serverless function
      : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001/n8n-proxy`  // Local development

    // Use proxy for N8N Cloud to bypass CORS
    const proxyBaseUrl = this.useProxy ? proxyUrl : cleanBaseUrl

    this.client = axios.create({
      baseURL: proxyBaseUrl,
      headers: this.useProxy ? {
        // For proxy mode: send N8N URL and API key as headers
        'X-N8N-BASE-URL': cleanBaseUrl,
        'X-N8N-API-KEY': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      } : {
        // For direct mode: standard N8N API headers
        'X-N8N-API-KEY': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      // Disable SSL verification for localhost (development only)
      ...(cleanBaseUrl.includes('localhost') && {
        validateStatus: (status) => status < 500,
      }),
    })

    if (this.useProxy) {
      console.log(`🔄 Using proxy server for N8N Cloud at ${proxyUrl}`)
      if (!isProduction) {
        console.log('   Make sure to run: npm run dev:proxy')
      }
    }
  }

  /**
   * Test connection to N8N instance
   */
  async testConnection(): Promise<boolean> {
    console.log('Testing N8N connection...')
    console.log('Base URL:', this.client.defaults.baseURL)
    console.log('Headers:', this.client.defaults.headers)

    // Try multiple endpoints to find the correct one
    const endpoints = [
      '/api/v1/workflows',
      '/api/workflows',
      '/workflows',
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`)
        const response = await this.client.get(endpoint, { params: { limit: 1 } })
        console.log('✅ N8N connection test successful!', {
          endpoint,
          status: response.status,
          data: response.data,
        })
        return true
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.warn(`❌ Endpoint ${endpoint} failed:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            code: error.code,
          })

          // If we get 401 or 403, it means the endpoint exists but auth failed
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.error('🔒 Authentication failed. Check your API key.')
            console.error('Response:', error.response?.data)
            return false
          }

          // If CORS error
          if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
            console.error('🌐 Network/CORS error. Make sure:')
            console.error('1. N8N is running')
            console.error('2. N8N_CORS_ORIGIN is configured')
            console.error('3. URL is correct')
            return false
          }
        } else {
          console.error(`Endpoint ${endpoint} error:`, error)
        }
      }
    }

    console.error('❌ All endpoints failed')
    return false
  }

  /**
   * Get all workflows (active only by default)
   * @param activeOnly - Filter to show only active workflows (default: true)
   */
  async getWorkflows(activeOnly = true): Promise<N8NWorkflow[]> {
    try {
      const response = await this.client.get<N8NWorkflowsResponse>('/api/v1/workflows')
      const allWorkflows = response.data.data || []

      // Filter active workflows only
      if (activeOnly) {
        return allWorkflows.filter(workflow => workflow.active === true)
      }

      return allWorkflows
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(id: string): Promise<N8NWorkflow> {
    try {
      const response = await this.client.get<N8NWorkflow>(`/api/v1/workflows/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get execution details
   */
  async getExecution(id: string): Promise<N8NExecution> {
    try {
      const response = await this.client.get<N8NExecution>(`/api/v1/executions/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get recent executions for a workflow
   */
  async getWorkflowExecutions(workflowId: string, limit = 10): Promise<N8NExecution[]> {
    try {
      const response = await this.client.get<{ data: N8NExecution[] }>('/api/v1/executions', {
        params: {
          workflowId,
          limit,
        },
      })
      return response.data.data || []
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Extract webhook URL from workflow nodes
   * For N8N Cloud, uses production webhook URL format
   */
  getWebhookUrl(workflow: N8NWorkflow, baseUrl: string): string | null {
    const webhookNode = workflow.nodes?.find(
      (node) => node.type === 'n8n-nodes-base.webhook' || node.type === 'n8n-nodes-base.formTrigger',
    )

    if (!webhookNode?.parameters) return null

    const path = webhookNode.parameters.path as string
    if (!path) return null

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    // For N8N Cloud, use the production webhook URL
    // N8N Cloud format: https://[instance].app.n8n.cloud/webhook-test/[path] (test)
    //                   https://[instance].app.n8n.cloud/webhook/[path] (production)
    if (baseUrl.includes('.app.n8n.cloud') || baseUrl.includes('n8n.cloud')) {
      // Use production webhook URL
      return `${baseUrl}/webhook/${cleanPath}`
    }

    // For self-hosted N8N, use the same format
    return `${baseUrl}/webhook/${cleanPath}`
  }

  /**
   * Check if workflow has a form trigger
   */
  hasFormTrigger(workflow: N8NWorkflow): boolean {
    return workflow.nodes?.some((node) => node.type === 'n8n-nodes-base.formTrigger') ?? false
  }

  /**
   * Error handler
   */
  private handleError(error: unknown): N8NError {
    if (axios.isAxiosError(error)) {
      return {
        message: error.response?.data?.message || error.message || 'N8N API request failed',
        code: error.response?.data?.code,
        httpStatusCode: error.response?.status,
      }
    }
    return {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Create N8N client instance
 */
export const createN8NClient = (baseUrl: string, apiKey: string, useProxy?: boolean): N8NClient => {
  if (!baseUrl || !apiKey) {
    throw new Error('N8N base URL and API key are required')
  }
  return new N8NClient(baseUrl, apiKey, useProxy)
}
