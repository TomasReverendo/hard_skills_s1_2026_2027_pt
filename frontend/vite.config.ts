// vite.config.ts: Configuração do Vite (servidor de desenvolvimento do frontend).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Para onde o proxy envia os pedidos /api:
//   - a correr localmente (npm run dev): Django em http://127.0.0.1:8080
//   - a correr no Docker:                o docker-compose define API_TARGET=http://backend:8000
//                                        ("backend" é o nome do serviço no docker-compose.yml)
// Uso 127.0.0.1 e não "localhost": no Windows o Node resolve localhost para IPv6 (::1),
// mas o runserver do Django só escuta em IPv4.
const API_TARGET = process.env.API_TARGET ?? 'http://127.0.0.1:8080'

export default defineConfig({
  // react():       compila o JSX/TSX do React
  // tailwindcss(): lê as classes do Tailwind usadas nos componentes e gera o CSS correspondente
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy: todos os pedidos para /api são reencaminhados para o Django.
    // Assim o navegador acha que frontend e backend estão na mesma origem,
    // e não é preciso configurar CORS no backend.
    proxy: {
      '/api': API_TARGET,
    },
  },
})
