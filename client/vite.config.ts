import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'vendor'
          }
          if (id.includes('node_modules/@reduxjs/toolkit') || id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) {
            return 'ui'
          }
          if (id.includes('node_modules/react-big-calendar') || id.includes('node_modules/moment')) {
            return 'calendar'
          }
          if (id.includes('node_modules/socket.io-client')) {
            return 'socket'
          }
        },
      },
    },
  },

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
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})