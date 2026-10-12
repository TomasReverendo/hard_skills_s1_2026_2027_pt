// types.ts — Tipos TypeScript que espelham as respostas JSON da API Django.
// Se o backend mudar o formato (polls/serializers.py), atualiza aqui também.

export type PollStatus = 'draft' | 'open' | 'closed'

export interface Option {
  id: number
  text: string
}

export interface Poll {
  id: number
  question: string
  status: PollStatus
  status_label: string // "Rascunho" | "Aberta" | "Fechada"
  created_at: string // data em formato ISO
  options: Option[]
  has_voted?: boolean // só vem no detalhe público (GET /api/polls/<id>)
  total_votes?: number // só vem na lista do anfitrião (GET /api/host/polls)
}

export interface OptionResult {
  id: number
  text: string
  votes: number
  percentage: number
}

export interface PollResults {
  poll_id: number
  total_votes: number
  options: OptionResult[]
}
