import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "PrimeDFit",
        short_name: "PrimeDFit",
        description: "A.I Fitness Center - Progressive Web Application",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        display_override: ["fullscreen", "minimal-ui"],
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            "src": "/pwa-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/pwa-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/pwa-maskable-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable"
          },
          {
            "src": "/pwa-maskable-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ],
        screenshots: [
          {
            "src": "/desktop-screenshot.png",
            "sizes": "1817x858",
            "type": "image/png",
            "form_factor": "wide",
            "label": "Wonder Widgets"
          },
          {
            "src": "/mobile-screenshot.png",
            "sizes": "424x856",
            "type": "image/png",
            // "form_factor": "wide",
            "label": "Wonder Widgets"
          }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  }
})
