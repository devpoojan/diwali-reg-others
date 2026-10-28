import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: true, // Listen on all local IPs (0.0.0.0)
    port: 5173,
    allowedHosts: true, // Allow Cloudflare tunnel and other external hosts
  },
})

