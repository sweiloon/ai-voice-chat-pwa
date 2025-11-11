import express from 'express'
import cors from 'cors'
import axios from 'axios'

const app = express()
const PORT = 3001

// Enable CORS for your frontend (including network access for mobile)
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}))

app.use(express.json())

// N8N Webhook proxy endpoint (for triggering workflows)
app.post('/n8n-webhook-proxy', async (req, res) => {
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
    res.status(response.status).json(response.data)
  } catch (error) {
    console.error('❌ Webhook proxy error:', error.response?.status, error.response?.data || error.message)

    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({
        error: error.response?.data || error.message
      })
    } else {
      res.status(500).json({ error: 'Internal webhook proxy error' })
    }
  }
})

// N8N API proxy endpoint
app.all('/n8n-proxy/*', async (req, res) => {
  try {
    const n8nApiKey = req.headers['x-n8n-api-key']
    const n8nBaseUrl = req.headers['x-n8n-base-url']

    if (!n8nApiKey || !n8nBaseUrl) {
      return res.status(400).json({
        error: 'Missing X-N8N-API-KEY or X-N8N-BASE-URL header'
      })
    }

    // Extract the path after /n8n-proxy/ and preserve query string
    const pathMatch = req.originalUrl.match(/\/n8n-proxy(\/.*)/)
    const path = pathMatch ? pathMatch[1].split('?')[0] : '/'
    const url = `${n8nBaseUrl}${path}`

    // Convert string query params to proper types for N8N
    const params = {}
    for (const [key, value] of Object.entries(req.query)) {
      // Convert numeric strings to numbers
      if (key === 'limit' || key === 'offset') {
        params[key] = parseInt(value, 10)
      } else {
        params[key] = value
      }
    }

    console.log(`Proxying ${req.method} ${url}`, params)

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

    res.status(response.status).json(response.data)
  } catch (error) {
    console.error('Proxy error:', error.response?.status, error.response?.data || error.message)

    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({
        error: error.response?.data || error.message
      })
    } else {
      res.status(500).json({ error: 'Internal proxy error' })
    }
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`N8N Proxy server running on:`)
  console.log(`  Local:   http://localhost:${PORT}`)
  console.log(`  Network: http://192.168.110.103:${PORT}`)
  console.log(`\nFrontend can use: http://localhost:${PORT}/n8n-proxy/api/v1/workflows`)
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`)
    console.error(`\nTo fix this, run: lsof -ti:${PORT} | xargs kill -9`)
    console.error(`Then restart the proxy server.\n`)
    process.exit(1)
  } else {
    console.error('Server error:', err)
    process.exit(1)
  }
})
