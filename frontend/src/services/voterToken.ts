// services/voterToken.ts: Identificador anónimo deste navegador (Nível 2: "um voto por pessoa").
//
// Na primeira visita gero um UUID aleatório e guardo-o no localStorage.
// É enviado com cada voto; o backend recusa um segundo voto do mesmo token
// na mesma votação.
//
// Limitação (explicada no README): basta abrir uma janela anónima, outro
// navegador ou limpar o localStorage para obter um token novo e votar outra vez.

const STORAGE_KEY = 'live-pulse-voter-token' // nome da chave no localStorage

export function getVoterToken(): string {
  try {
    let token = localStorage.getItem(STORAGE_KEY)
    if (!token) {
      token = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, token)
    }
    return token
  } catch {
    // localStorage pode estar bloqueado (ex.: alguns modos privados).
    // Nesse caso uso um token só para esta sessão.
    return crypto.randomUUID()
  }
}
