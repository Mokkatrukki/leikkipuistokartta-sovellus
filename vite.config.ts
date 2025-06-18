import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/leikkipuistokartta-sovellus/', // Set the base path for GitHub Pages
  plugins: [
    tailwindcss(),
    react()
  ],
})
