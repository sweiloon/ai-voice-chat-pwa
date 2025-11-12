import { toast } from 'sonner'
import { useSessionStore } from '@/store/sessions'

/**
 * Custom hook for managing data export/import functionality
 * Handles JSON backup creation and restoration
 */
export const useDataControl = () => {
  const { exportData, importData } = useSessionStore()

  const handleExport = async () => {
    const snapshot = await exportData()
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resonance-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export complete. Keep the JSON safe.')
  }

  const handleImport = async (file: File) => {
    const text = await file.text()
    try {
      const payload = JSON.parse(text)
      await importData(payload)
      toast.success('Import successful')
    } catch (error) {
      toast.error('Invalid JSON snapshot')
      console.error(error)
    }
  }

  return { handleExport, handleImport }
}
