# N8N Integration Setup Guide

## Problem
N8N Cloud (*.app.n8n.cloud) has strict Content Security Policy (CSP) that blocks direct browser requests, causing CORS errors.

## Solution
Use a proxy server to bypass CORS restrictions.

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
```

Dependencies `express` and `cors` have been added to package.json.

### Step 2: Start the Proxy Server

Open a **new terminal window** and run:
```bash
npm run dev:proxy
```

You should see:
```
N8N Proxy server running on http://localhost:3001
```

**Keep this terminal running!**

### Step 3: Start Your App

In your **original terminal**, run:
```bash
npm run dev
```

### Step 4: Configure N8N in Your App

1. Open your app: `http://localhost:5173`
2. Click **Settings** (gear icon)
3. Click the **"N8N"** tab
4. Enter your credentials:
   - **N8N Instance URL**: `https://apipietech.app.n8n.cloud`
   - **API Key**: Your N8N API key
5. Click **"Test Connection"**
6. You should see "✅ N8N connection successful!"

### Step 5: View Workflows

1. Navigate to the **N8N** section (bottom tab on mobile, or `/n8n` route)
2. Your workflows should load automatically!

## How It Works

The proxy server (`server.js`) runs on port 3001 and:
1. Receives requests from your frontend
2. Forwards them to N8N Cloud with proper headers
3. Returns the response back to your frontend

This bypasses browser CORS restrictions because:
- Browser → Proxy: Same origin (localhost)
- Proxy → N8N Cloud: Server-to-server (no CORS)

## Troubleshooting

### "Connection Refused" Error
**Problem**: Proxy server not running
**Solution**: Make sure you ran `npm run dev:proxy` in a separate terminal

### "Still Getting CORS Errors"
**Problem**: Proxy server crashed or port 3001 is in use
**Solution**:
1. Check proxy terminal for errors
2. Try stopping the proxy (Ctrl+C) and restarting
3. Check if port 3001 is available: `lsof -i :3001`

### "Network Error"
**Problem**: N8N Cloud URL or API key is incorrect
**Solution**: Double-check your N8N credentials in Settings → N8N tab

## Production Deployment

For production, you'll need to:
1. Deploy the proxy server to a hosting service (Heroku, Railway, Vercel, etc.)
2. Update `src/n8n/client.ts` to use your production proxy URL instead of `http://localhost:3001`

Example:
```typescript
const proxyBaseUrl = this.useProxy
  ? 'https://your-proxy-server.com/n8n-proxy'
  : cleanBaseUrl
```

## Files Changed

- `server.js` - New proxy server
- `package.json` - Added proxy script and dependencies
- `src/n8n/client.ts` - Auto-detects N8N Cloud and uses proxy
- `src/components/settings/SettingsSheet.tsx` - Separate N8N tab
