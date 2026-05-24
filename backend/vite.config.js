import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` being run in
  const env = loadEnv(mode, process.cwd(), '')
  
  // Parse allowed hosts from environment
  const allowedHosts = (env.VITE_ALLOWED_HOSTS || 'localhost,127.0.0.1').split(',').map(h => h.trim())
  const devPort = parseInt(env.VITE_DEV_PORT || '5173', 10)
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3001'

  return {
    server: {
      host: true,
      allowedHosts: allowedHosts,
      port: devPort,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
