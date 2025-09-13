import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import vitePlugin from '@tanstack/router-plugin/vite'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitePlugin({
      autoCodeSplitting: true,
      routesDirectory: resolve(__dirname, './src/routes'),
      generatedRouteTree: resolve(__dirname, './src/routeTree.gen.ts')
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
