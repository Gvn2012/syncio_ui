import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [react(), mkcert()],
  server: {
    https: {},
    host: true,
    hmr: {
      host: '192.168.1.94',
    },
    proxy: {
      '/api': {
        target: 'http://syncio.site',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'http://syncio.site',
        ws: true,
        changeOrigin: true,
        secure: false,
        timeout: 0,
        proxyTimeout: 0,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Vite Proxy] WebSocket Error:', err);
          });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', (err) => {
              console.error('[Vite Proxy] Socket Error:', err);
            });
          });
        }
      }
    }
  }
})
