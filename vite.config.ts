import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        "name": "SrPol",
        "short_name": "SrPol",
        "description": "Aplicación para restaurantes",
        "theme_color": "#ffffff",
        "icons": [
          {
            "src": "/logo192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "/logo512.png",
            "sizes": "512x512",
            "type": "image/png"
          }
        ],
        "start_url": ".",
        "display": "standalone",
        "background_color": "#ffffff"
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    })
    
  ],
})