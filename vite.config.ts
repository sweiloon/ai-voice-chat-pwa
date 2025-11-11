import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const manifest = {
  name: 'Resonance – AI Voice Chat',
  short_name: 'Resonance',
  start_url: '/',
  scope: '/',
  display: 'standalone' as const,
  orientation: 'portrait-primary' as const,
  background_color: '#050608',
  theme_color: '#0f172a',
  description: 'Local-first AI chat with N8N workflow integration. Voice + text modes.',
  categories: ['productivity', 'utilities'],
  icons: [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
    },
    {
      src: '/icons/icon-maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable' as const,
    },
  ],
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      manifest,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
      devOptions: {
        enabled: false, // Disable in development for faster HMR
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Production optimizations
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-switch', '@radix-ui/react-tabs'],
          'state-vendor': ['zustand', 'idb'],
          'ai-vendor': ['axios'],
        },
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'idb', 'axios'],
  },
})
