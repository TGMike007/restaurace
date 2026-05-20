import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Důležité pro přístup z Dockeru/jiných strojů
    port: 3000,     // Port, na kterém poběží Vite dev server
    proxy: {
      // Všechny požadavky začínající /api budou přesměrovány na backend
      '/api': {
        // Cíl: název služby backendu a port v Docker Compose
        target: 'http://backend:5000',
        changeOrigin: true, // Potřebné pro virtuální hostování
        // secure: false,      // Pokud backend běží na HTTPS s self-signed certifikátem
        // rewrite: (path) => path.replace(/^\/api/, ''), // Pokud nechcete /api v cílové URL
      }
    }
  }
})
