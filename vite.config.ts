import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** For GitHub Pages project sites, set `VITE_BASE=/repo-name/` before build. */
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Ribbon',
        short_name: 'Ribbon',
        description: 'Catálogo local de mídias em JSON Lines (.jsonl)',
        display: 'standalone',
        theme_color: '#1a1a2e',
        background_color: '#16161f',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
