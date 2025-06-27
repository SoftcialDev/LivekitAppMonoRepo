import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import copy from 'rollup-plugin-copy'

import path from 'path'
import { fileURLToPath } from 'url'

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
      '@':           path.resolve(__dirname, 'src'),
      '@assets':     path.resolve(__dirname, 'src/assets'),
      '@components': path.resolve(__dirname, 'src/components'),
    },
  },
})
