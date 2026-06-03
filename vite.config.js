import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      jpg: { quality: 70 },
      jpeg: { quality: 70 },
      png: { quality: 70 },
      webp: { quality: 70 },
    })
  ],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || ''
          // Keep images with their original names, no hash
          if (/\.(jpe?g|png|webp)$/i.test(name)) {
            return `assets/images/[name][extname]`
          }
          // Everything else (css, fonts etc) keeps hash
          return `assets/[name]-[hash][extname]`
        }
      }
    }
  }
})