import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // WSL sobre /mnt/d no emite eventos de fs: sin polling el HMR no ve cambios.
    watch: {
      usePolling: Boolean(process.env.WSL_DISTRO_NAME || process.env.CHOKIDAR_USEPOLLING),
      interval: 400,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
