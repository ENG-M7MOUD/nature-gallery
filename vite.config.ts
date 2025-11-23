import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ضيف السطر ده، وحط اسم الريبو بتاعك بين علامتين /
  base: '/nature-gallery/',
})
