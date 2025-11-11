import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: './vitest.setup.ts',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['node_modules/**/*', 'tests/**/*'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
