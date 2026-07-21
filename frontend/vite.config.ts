import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Vite 8 blocks requests to hosts that aren't in this list (DNS-rebinding guard).
    // Add every hostname users hit this dev server from. Wildcards OK.
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'homelab.local',
      '.homelab.local',       // catch subdomains
      '.ffly.site',            // catch public *.ffly.site (nav.ffly.site, etc.)
      '192.168.100.99',        // LAN IP
      '100.83.235.28',         // public/NAT IP
    ],
    proxy: Object.fromEntries(
      ['/auth', '/products', '/inventory', '/orders', '/deliveries', '/tracking', '/analytics', '/reports', '/health'].map((path) => [
        path,
        { target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000', changeOrigin: true },
      ]),
    ),
  },
})
