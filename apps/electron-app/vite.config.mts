// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import copy from 'rollup-plugin-copy'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(root, 'src')
const outDir = path.resolve(root, 'dist')

export default defineConfig({
  // force all asset links to be relative (./assets/…) in the built HTML
  base: './',

  root: srcDir,

  plugins: [
    react(),
    tailwind(),
    svgr(),

    // after Vite writes everything, copy exactly these three files into dist/assets
    copy({
      targets: [
        { src: path.resolve(srcDir, 'assets/icon.ico'),           dest: path.resolve(outDir, 'assets') },
        { src: path.resolve(srcDir, 'assets/app.png'),            dest: path.resolve(outDir, 'assets') },
        { src: path.resolve(srcDir, 'assets/InContact_logo.png'), dest: path.resolve(outDir, 'assets') },
      ],
      hook: 'writeBundle',
      copyOnce: true,
    }),
  ],

  resolve: {
    alias: {
      '@':           srcDir,
      '@assets':     path.resolve(srcDir, 'assets'),
      '@components': path.resolve(srcDir, 'components'),
    },
  },

  server: {
    port: 3000,
    strictPort: true,
  },

  build: {
    // emit everything into electron-app/dist
    outDir,
    emptyOutDir: true,

    // put JS/CSS chunks into dist/assets/*
    assetsDir: 'assets',

    rollupOptions: {
      // use your src/index.html as the template
      input: path.resolve(srcDir, 'index.html'),
    },
  },
})
