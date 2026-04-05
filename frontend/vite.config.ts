/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true, // Nos permite usar describe, it, expect sin importarlos en cada archivo
    environment: 'jsdom', // Simula el navegador
    setupFiles: './src/setupTests.ts', // Archivo que se corre antes de las pruebas
    css: false, // Ignorar CSS en las pruebas hace que corran mucho más rápido
  },
})
