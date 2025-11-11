const axios = require('axios')

/**
 * Vercel Serverless Function for N8N Proxy
 * Handles both webhook triggers and N8N API calls
 */
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-N8N-API-KEY, X-N8N-BASE-URL, X-Webhook-URL')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Determine if this is a webhook trigger or API proxy call
    const isWebhook = req.url === '/api/n8n-proxy' || req.url.startsWith('/api/n8n-proxy?')

    if (isWebhook && req.method === 'POST') {
      // Handle N8N Webhook Proxy
      return await handleWebhookProxy(req, res)
    } else {
      // Handle N8N API Proxy
      return await handleApiProxy(req, res)
    }
  } catch (error) {
    console.error('Handler error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}

/**
 * Handle N8N webhook trigger proxy
 */
async function handleWebhookProxy(req, res) {
  try {
    const webhookUrl = req.headers['x-webhook-url']

    if (!webhookUrl) {
      return res.status(400).json({
        error: 'Missing X-Webhook-URL header'
      })
    }

    console.log(`🔗 Proxying webhook to: ${webhookUrl}`)

    const response = await axios({
      method: 'POST',
      url: webhookUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      data: req.body,
      timeout: 30000,
    })

    console.log('✅ Webhook triggered successfully')
    return res.status(response.status).json(response.data)
  } catch (error) {
    console.error('❌ Webhook proxy error:', error.response?.status, error.response?.data || error.message)

    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: error.response?.data || error.message
      })
    } else {
      return res.status(500).json({ error: 'Internal webhook proxy error' })
    }
  }
}

/**
 * Handle N8N API proxy
 */
async function handleApiProxy(req, res) {
  try {
    // Get headers case-insensitively
    const getHeader = (name) => {
      const lowerName = name.toLowerCase()
      return req.headers[lowerName] || req.headers[name]
    }

    const n8nApiKey = getHeader('x-n8n-api-key') || getHeader('X-N8N-API-KEY')
    const n8nBaseUrl = getHeader('x-n8n-base-url') || getHeader('X-N8N-BASE-URL')

    console.log('🔍 Debug - Headers received:', {
      apiKeyPresent: !!n8nApiKey,
      baseUrlPresent: !!n8nBaseUrl,
      baseUrl: n8nBaseUrl,
      allHeaders: Object.keys(req.headers)
    })

    if (!n8nApiKey || !n8nBaseUrl) {
      return res.status(400).json({
        error: 'Missing X-N8N-API-KEY or X-N8N-BASE-URL header',
        debug: {
          headers: Object.keys(req.headers),
          apiKeyPresent: !!n8nApiKey,
          baseUrlPresent: !!n8nBaseUrl
        }
      })
    }

    // Extract the path after /api/n8n-proxy/ and preserve query string
    const pathMatch = req.url.match(/\/api\/n8n-proxy(\/.*)/)
    const path = pathMatch ? pathMatch[1].split('?')[0] : '/api/v1/workflows'
    const url = `${n8nBaseUrl}${path}`

    // Convert string query params to proper types for N8N
    const params = {}
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        // Convert numeric strings to numbers
        if (key === 'limit' || key === 'offset') {
          params[key] = parseInt(value, 10)
        } else {
          params[key] = value
        }
      }
    }

    console.log(`🔗 Proxying ${req.method} ${url}`, { params })

    const response = await axios({
      method: req.method,
      url: url,
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      data: req.body,
      params: params,
    })

    console.log(`✅ Proxy successful: ${response.status}`)
    return res.status(response.status).json(response.data)
  } catch (error) {
    console.error('❌ API proxy error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    })

    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: error.response?.data || error.message,
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message
        }
      })
    } else {
      return res.status(500).json({ error: 'Internal proxy error', message: error.message })
    }
  }
}
