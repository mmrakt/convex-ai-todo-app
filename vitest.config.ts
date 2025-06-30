/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    server: {
      deps: {
        inline: ['convex-test']
      }
    },
    environmentMatchGlobs: [
      ['**/convex/**', 'edge-runtime']
    ]
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})