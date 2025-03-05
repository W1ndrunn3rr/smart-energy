import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Important for Docker networking
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'http://backend:8000', // Use service name from docker-compose
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false
      }
    }
  }
})