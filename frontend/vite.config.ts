// vite.config.ts — Configuração do Vite (servidor de desenvolvimento do frontend).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy: todos os pedidos para /api são reencaminhados para o Django (porta 8080).
    // Assim o navegador acha que frontend e backend estão na mesma origem,
    // e não precisamos de configurar CORS no backend.
    proxy: {
      // 127.0.0.1 e não "localhost": no Windows o Node resolve localhost para IPv6 (::1),
      // mas o runserver do Django só escuta em IPv4.
      '/api': 'http://127.0.0.1:8080',
    },
  },
})
