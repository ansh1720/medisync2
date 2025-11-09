import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/medisync2/', // GitHub Pages repository name
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
    port: 3000,      // Use consistent port
    strictPort: true // Fail if port is in use instead of trying another
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
})
