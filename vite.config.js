import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api/p2pf': {
        target: 'https://www.p2pf.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/p2pf/, '/api')
      }
    }
  }
})
