import type { N8NWorkflow } from './types'

/**
 * Debug utility to inspect N8N workflow structure and webhook data
 */
export function debugWorkflowWebhook(workflow: N8NWorkflow, baseUrl: string) {
  console.group(`🔍 Webhook Debug: ${workflow.name}`)

  console.log('📋 Workflow ID:', workflow.id)
  console.log('🌐 Base URL:', baseUrl)
  console.log('✅ Active:', workflow.active)

  if (!workflow.nodes || workflow.nodes.length === 0) {
    console.warn('⚠️ No nodes found in workflow')
    console.groupEnd()
    return null
  }

  console.log(`📊 Total nodes: ${workflow.nodes.length}`)

  // Find webhook or form trigger nodes
  const webhookNode = workflow.nodes.find(
    (node) => node.type === 'n8n-nodes-base.webhook' || node.type === 'n8n-nodes-base.formTrigger'
  )

  if (!webhookNode) {
    console.warn('⚠️ No webhook/form trigger found in nodes')
    console.log('📦 Available node types:', workflow.nodes.map(n => n.type))
    console.groupEnd()
    return null
  }

  console.log('✅ Found trigger node:', webhookNode.type)
  console.log('📝 Node name:', webhookNode.name)
  console.log('🔢 Type version:', webhookNode.typeVersion)

  // Log all available data on the webhook node
  console.group('🔗 Webhook Node Data:')
  console.log('Full node object:', JSON.stringify(webhookNode, null, 2))

  if (webhookNode.webhookId) {
    console.log('✅ webhookId found:', webhookNode.webhookId)
  } else {
    console.warn('⚠️ No webhookId property on node')
  }

  if (webhookNode.parameters) {
    console.log('📋 Parameters:', JSON.stringify(webhookNode.parameters, null, 2))

    const path = webhookNode.parameters.path as string
    if (path) {
      console.log('✅ Webhook path found:', path)
    } else {
      console.warn('⚠️ No path in parameters')
    }
  } else {
    console.warn('⚠️ No parameters on node')
  }
  console.groupEnd()

  // Try to construct webhook URL
  console.group('🏗️ URL Construction Attempts:')

  // Method 1: Using webhookId
  if (webhookNode.webhookId) {
    const url1 = `${baseUrl}/webhook/${webhookNode.webhookId}`
    console.log('Method 1 (webhookId):', url1)
  }

  // Method 2: Using path
  if (webhookNode.parameters?.path) {
    const path = webhookNode.parameters.path as string
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    const url2 = `${baseUrl}/webhook/${cleanPath}`
    console.log('Method 2 (path):', url2)
  }

  // Method 3: Check if N8N provides webhook URL directly
  const anyWebhookUrl = Object.entries(webhookNode).find(([key]) =>
    key.toLowerCase().includes('webhook') && key.toLowerCase().includes('url')
  )
  if (anyWebhookUrl) {
    console.log('Method 3 (direct URL property):', anyWebhookUrl)
  }

  console.groupEnd()
  console.groupEnd()

  return webhookNode
}

/**
 * Test webhook URL by making a simple GET request
 */
export async function testWebhookUrl(url: string): Promise<boolean> {
  console.log(`🧪 Testing webhook URL: ${url}`)

  try {
    // Most N8N webhooks respond to GET with method info
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    console.log('📊 Response status:', response.status)
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const text = await response.text()
      console.log('📊 Response body:', text)
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}
