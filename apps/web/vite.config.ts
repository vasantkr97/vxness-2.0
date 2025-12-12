
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/backpack': {
        target: 'https://api.backpack.exchange',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backpack/, ''),
      },
    },
  },
})
