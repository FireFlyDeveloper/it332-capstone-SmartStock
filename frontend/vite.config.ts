import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiBase = env.VITE_API_BASE?.trim()

  if (mode === 'production') {
    if (!apiBase) {
      throw new Error('VITE_API_BASE is required for production builds; configure the deployed API origin.')
    }
    let apiUrl: URL
    try {
      apiUrl = new URL(apiBase)
    } catch {
      throw new Error('VITE_API_BASE must be an absolute HTTPS URL for production builds.')
    }
    if (apiUrl.protocol !== 'https:' || apiUrl.username || apiUrl.password || apiUrl.pathname !== '/' || apiUrl.search || apiUrl.hash) {
      throw new Error('VITE_API_BASE must be an absolute HTTPS origin without credentials, path, query, or fragment.')
    }
  }

  return {
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
  }
})
