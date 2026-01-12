import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import copy from 'rollup-plugin-copy'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    svgr(),
    copy({
      targets: [
        { src: 'staticwebapp.config.json', dest: 'dist' }
      ],
      hook: 'writeBundle'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/modules': path.resolve(__dirname, 'src/modules'),
      '@/ui-kit': path.resolve(__dirname, 'src/ui-kit'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@assets': path.resolve(__dirname, 'src/shared/assets'),
    },
  },
})

