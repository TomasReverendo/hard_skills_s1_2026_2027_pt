// Chama `callback` de X em X milissegundos enquanto `enabled` for true.
// Escolhi polling em vez de WebSockets/SSE por ser o mais simples:
// não precisa de nada novo no backend (usa os mesmos endpoints REST).
// A justificação completa está no README.

import { useEffect, useRef } from 'react'

export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  // Guardo sempre a versão mais recente do callback numa ref,
  // para o intervalo não ficar a chamar uma versão antiga.
  const savedCallback = useRef(callback)
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => savedCallback.current(), intervalMs)
    return () => clearInterval(id) // limpa o intervalo ao sair da página
  }, [intervalMs, enabled])
}
