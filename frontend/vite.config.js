import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': { target: process.env.VITE_DEV_API_TARGET || 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: process.env.VITE_DEV_API_TARGET || 'http://localhost:5000', changeOrigin: true }
    }
  },
  preview: { port: 4173 }
})

// Triggering Vite restart to load .env
