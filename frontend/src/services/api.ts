// services/api.ts — Todas as chamadas HTTP ao backend estão aqui.
// Os componentes nunca usam fetch diretamente: chamam estas funções.
// Assim, se um URL mudar, só se altera este ficheiro.

import type { Poll, PollResults, PollStatus } from '../types'

// Caminho relativo: o Vite reencaminha /api para o Django (ver vite.config.ts)
const BASE_URL = '/api'

/**
 * Função genérica que faz o pedido e trata erros num só sítio.
 * Se o backend devolver um código de erro (4xx/5xx), lança um Error
 * com a mensagem que veio em {"error": "..."}.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    // fetch só falha assim se o servidor estiver em baixo / sem rede
    throw new Error('Não foi possível ligar ao servidor.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error ?? `Erro inesperado (${response.status}).`)
  }
  return data as T
}

// ---------------------------------------------------------------------------
// Público
// ---------------------------------------------------------------------------

export async function getPublicPolls(): Promise<Poll[]> {
  const data = await request<{ polls: Poll[] }>('/polls')
  return data.polls
}

export function getPublicPoll(pollId: string, voterToken: string): Promise<Poll> {
  // encodeURIComponent protege caracteres especiais no URL
  return request<Poll>(`/polls/${pollId}?voter_token=${encodeURIComponent(voterToken)}`)
}

export function submitVote(pollId: string, optionId: number, voterToken: string) {
  return request<{ message: string }>(`/polls/${pollId}/votes`, {
    method: 'POST',
    body: JSON.stringify({ option_id: optionId, voter_token: voterToken }),
  })
}

export function getPublicResults(pollId: string): Promise<PollResults> {
  return request<PollResults>(`/polls/${pollId}/results`)
}

// ---------------------------------------------------------------------------
// Anfitrião
// ---------------------------------------------------------------------------

export async function getHostPolls(): Promise<Poll[]> {
  const data = await request<{ polls: Poll[] }>('/host/polls')
  return data.polls
}

export function createPoll(question: string, options: string[]): Promise<Poll> {
  return request<Poll>('/host/polls', {
    method: 'POST',
    body: JSON.stringify({ question, options }),
  })
}

export function updatePollStatus(pollId: string, status: PollStatus): Promise<Poll> {
  return request<Poll>(`/host/polls/${pollId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getHostResults(pollId: string): Promise<PollResults> {
  return request<PollResults>(`/host/polls/${pollId}/results`)
}

export function getHostPoll(pollId: string): Promise<Poll> {
  return request<Poll>(`/host/polls/${pollId}`)
}
