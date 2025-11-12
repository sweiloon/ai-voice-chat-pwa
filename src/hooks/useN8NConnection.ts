import { useState } from 'react'
import { toast } from 'sonner'
import { useN8NStore } from '@/store/n8n'

/**
 * Custom hook for managing N8N connection testing and settings
 * Handles connection validation and settings persistence
 */
export const useN8NConnection = () => {
  const { settings: n8nSettings, setSettings: setN8NSettings, testConnection } = useN8NStore()

  const [instanceType, setInstanceType] = useState<'cloud' | 'self-hosted'>(
    n8nSettings.instanceType || 'cloud'
  )
  const [n8nBaseUrl, setN8NBaseUrl] = useState(n8nSettings.baseUrl || '')
  const [n8nApiKey, setN8NApiKey] = useState(n8nSettings.apiKey || '')
  const [useProxy, setUseProxy] = useState(n8nSettings.useProxy ?? false)
  const [showN8NApiKey, setShowN8NApiKey] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)

  const handleN8NTest = async () => {
    if (!n8nBaseUrl || !n8nApiKey) {
      toast.error('Please enter both N8N URL and API key')
      return
    }

    setN8NSettings({
      instanceType,
      baseUrl: n8nBaseUrl,
      apiKey: n8nApiKey,
      useProxy: instanceType === 'self-hosted' ? useProxy : undefined
    })
    setTestingConnection(true)

    try {
      const connected = await testConnection()
      if (connected) {
        toast.success('N8N connection successful!')
      } else {
        toast.error('N8N connection failed. Check browser console (F12) for details.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Connection failed: ${errorMessage}`)
      console.error('N8N test error:', error)
    } finally {
      setTestingConnection(false)
    }
  }

  const handleN8NSave = () => {
    setN8NSettings({
      instanceType,
      baseUrl: n8nBaseUrl,
      apiKey: n8nApiKey,
      useProxy: instanceType === 'self-hosted' ? useProxy : undefined
    })
    toast.success('N8N settings saved')
  }

  return {
    // N8N settings state
    n8nSettings,
    instanceType,
    setInstanceType,
    n8nBaseUrl,
    setN8NBaseUrl,
    n8nApiKey,
    setN8NApiKey,
    useProxy,
    setUseProxy,
    showN8NApiKey,
    setShowN8NApiKey,
    testingConnection,

    // N8N actions
    handleN8NTest,
    handleN8NSave
  }
}
