export const uuid = () => crypto.randomUUID()

export const formatTimestamp = (date: number | Date) => {
  const value = typeof date === 'number' ? new Date(date) : date
  return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const chunkString = (text: string, size = 16) => {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message)
}

export const isBrowser = typeof window !== 'undefined'

export const safeJsonParse = <T>(value: string | null): T | undefined => {
  if (!value) return undefined
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.warn('Failed to parse JSON', error)
    return undefined
  }
}
