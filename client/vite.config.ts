import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:4200',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:4200',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})