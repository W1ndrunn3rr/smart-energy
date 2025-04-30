import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Important for Docker networking
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'http://backend:8080', // Changed to HTTP if your backend doesn't have proper SSL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'text/plain'
            });
            res.end('Proxy error');
          });
        }
      }
    }
  }
})