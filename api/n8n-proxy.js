import axios from 'axios'

/**
 * Vercel Serverless Function for N8N Proxy
 * Last deployed: 2025-11-12 - Force rebuild to clear Vercel cache
 */
export default async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-N8N-API-KEY, X-N8N-BASE-URL, X-Webhook-URL')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Get headers (case-insensitive)
    const headers = req.headers || {}
    const n8nApiKey = headers['x-n8n-api-key'] || headers['X-N8N-API-KEY']
    const n8nBaseUrl = headers['x-n8n-base-url'] || headers['X-N8N-BASE-URL']
    const webhookUrl = headers['x-webhook-url'] || headers['X-Webhook-URL']

    console.log('[N8N Proxy] Request:', {
      method: req.method,
      url: req.url,
      hasApiKey: !!n8nApiKey,
      hasBaseUrl: !!n8nBaseUrl,
      hasWebhookUrl: !!webhookUrl
    })

    // Handle webhook proxy
    if (webhookUrl && req.method === 'POST') {
      console.log('[N8N Proxy] Webhookproxy:', webhookUrl)

      const response = await axios({
        method: 'POST',
        url: webhookUrl,
        headers: { 'Content-Type': 'application/json' },
        data: req.body || {},
        timeout: 30000
      })

      console.log('[N8N Proxy] Webhook success:', response.status)
      return res.status(response.status).json(response.data)
    }

    // Handle API proxy
    if (!n8nApiKey || !n8nBaseUrl) {
      console.error('[N8N Proxy] Missing credentials')
      return res.status(400).json({
        error: 'Missing X-N8N-API-KEY or X-N8N-BASE-URL header',
        received: {
          hasApiKey: !!n8nApiKey,
          hasBaseUrl: !!n8nBaseUrl
        }
      })
    }

    // Extract path and query from URL
    const urlMatch = req.url.match(/\/api\/n8n-proxy(\/.*)/)
    const fullPath = urlMatch ? urlMatch[1] : '/api/v1/workflows'
    const [path, queryString] = fullPath.split('?')

    // Parse query parameters
    const params = {}
    if (queryString) {
      const searchParams = new URLSearchParams(queryString)
      searchParams.forEach((value, key) => {
        // Convert limit/offset to numbers
        params[key] = (key === 'limit' || key === 'offset') ? parseInt(value, 10) : value
      })
    }

    const targetUrl = `${n8nBaseUrl}${path}`
    console.log('[N8N Proxy] API proxy:', targetUrl, params)

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: req.body || undefined,
      params: params,
      timeout: 30000
    })

    console.log('[N8N Proxy] API success:', response.status)
    return res.status(response.status).json(response.data)

  } catch (error) {
    console.error('[N8N Proxy] Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    })

    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({
        error: error.response.data || error.message,
        status: error.response.status
      })
    }

    return res.status(500).json({
      error: 'Proxy error',
      message: error.message
    })
  }
}
